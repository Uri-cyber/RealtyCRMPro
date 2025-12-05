import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { z } from 'zod';
import {
  findLeadByPhone,
  getLeadConversationHistory,
  storeConversation,
  updateLeadScore,
  getLeadAgent,
  logActivity,
  Lead,
} from '../lib/database';
import {
  qualifyLead,
  generateWelcomeMessage,
  suggestLeadStatus,
  BANTScore,
} from '../lib/openai';
import {
  parseTwilioBody,
  validateTwilioSignature,
  sendSMS,
  generateTwiMLResponse,
  normalizePhoneNumber,
  TwilioWebhookPayload,
} from '../lib/twilio';

// Input validation schema
const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string(),
});

interface ProcessingResult {
  success: boolean;
  leadId?: string;
  responseMessage?: string;
  bantScore?: BANTScore;
  error?: string;
}

/**
 * Main handler for Twilio SMS webhook
 * Processes incoming SMS, qualifies lead with AI, and sends response
 */
async function handleTwilioWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Lead Qualification Function triggered');

  try {
    // Parse the webhook body
    const bodyText = await request.text();
    const payload = parseTwilioBody(bodyText);

    // Validate Twilio signature (security)
    const signature = request.headers.get('x-twilio-signature') || '';
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || request.url;

    // Convert payload to Record<string, string> for signature validation
    const paramsForValidation: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        paramsForValidation[key] = String(value);
      }
    }

    if (!validateTwilioSignature(webhookUrl, paramsForValidation, signature)) {
      context.warn('Invalid Twilio signature');
      // In production, you may want to reject invalid signatures
      // For now, we log a warning but continue (for testing)
      if (process.env.NODE_ENV === 'production') {
        return {
          status: 403,
          body: 'Invalid signature',
        };
      }
    }

    // Validate payload structure
    const validation = twilioWebhookSchema.safeParse(payload);
    if (!validation.success) {
      context.error('Invalid webhook payload:', validation.error);
      return {
        status: 400,
        headers: { 'Content-Type': 'application/xml' },
        body: generateTwiMLResponse(),
      };
    }

    // Process the incoming message
    const result = await processIncomingSMS(payload, context);

    // Return TwiML response
    // We send the actual response asynchronously via Twilio API
    // This allows for better tracking and doesn't block the webhook
    return {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
      body: generateTwiMLResponse(),
    };
  } catch (error) {
    const err = error as Error;
    context.error('Error processing webhook:', err.message, err.stack);

    return {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
      body: generateTwiMLResponse(),
    };
  }
}

/**
 * Process incoming SMS message
 * - Find or handle unknown lead
 * - Get conversation history
 * - Call OpenAI for qualification
 * - Store conversation
 * - Update lead score
 * - Send response
 */
async function processIncomingSMS(
  payload: TwilioWebhookPayload,
  context: InvocationContext
): Promise<ProcessingResult> {
  const { From: fromNumber, Body: messageBody, MessageSid: messageSid } = payload;
  const normalizedPhone = normalizePhoneNumber(fromNumber);

  context.log(`Processing SMS from ${normalizedPhone}: "${messageBody.substring(0, 50)}..."`);

  // Step 1: Find the lead by phone number
  const lead = await findLeadByPhone(normalizedPhone);

  if (!lead) {
    context.log(`No lead found for phone ${normalizedPhone}`);
    // Send a response asking them to contact via website
    const responseMessage =
      "Hi! Thanks for reaching out. We don't have your info on file yet. " +
      'Please visit our website to get started, or reply with your name and email.';

    await sendSMS(fromNumber, responseMessage);

    return {
      success: true,
      responseMessage,
    };
  }

  context.log(`Found lead: ${lead.id} (${lead.firstName} ${lead.lastName})`);

  // Step 2: Get the agent to attribute communications to
  const agent = await getLeadAgent(lead);
  if (!agent) {
    context.error(`No agent found for lead ${lead.id} in tenant ${lead.tenantId}`);
    return {
      success: false,
      leadId: lead.id,
      error: 'No agent assigned',
    };
  }

  // Step 3: Store the incoming message
  await storeConversation({
    tenantId: lead.tenantId,
    leadId: lead.id,
    userId: agent.id,
    type: 'SMS',
    body: messageBody,
    subject: `Inbound SMS (${messageSid})`,
    status: 'received',
    direction: 'inbound',
  });

  // Step 4: Get conversation history for context
  const conversationHistory = await getLeadConversationHistory(lead.id, 15);

  // Step 5: Call OpenAI for BANT qualification
  let qualificationResult;
  try {
    qualificationResult = await qualifyLead(lead, conversationHistory, messageBody);
    context.log(`BANT Score: ${qualificationResult.bantScore.totalScore}`);
  } catch (aiError) {
    const err = aiError as Error;
    context.error('OpenAI qualification error:', err.message);

    // Fallback response if AI fails
    const fallbackMessage =
      "Thanks for your message! One of our agents will get back to you shortly.";
    await sendSMS(fromNumber, fallbackMessage);

    await storeConversation({
      tenantId: lead.tenantId,
      leadId: lead.id,
      userId: agent.id,
      type: 'SMS',
      body: fallbackMessage,
      subject: 'AI Response (Fallback)',
      status: 'sent',
      direction: 'outbound',
    });

    return {
      success: true,
      leadId: lead.id,
      responseMessage: fallbackMessage,
      error: `AI error: ${err.message}`,
    };
  }

  const { bantScore, responseMessage, shouldEscalate, escalationReason } = qualificationResult;

  // Step 6: Update lead score and status
  const suggestedStatus = suggestLeadStatus(bantScore);
  const assessmentNotes = formatBANTAssessment(bantScore);

  await updateLeadScore(
    lead.id,
    bantScore.totalScore,
    suggestedStatus !== lead.status ? suggestedStatus : undefined,
    assessmentNotes
  );

  // Step 7: Log the qualification activity
  await logActivity({
    tenantId: lead.tenantId,
    userId: agent.id,
    entityType: 'lead',
    entityId: lead.id,
    action: 'ai_qualified',
    details: {
      messageSid,
      bantScore: bantScore.totalScore,
      budget: bantScore.budget.score,
      authority: bantScore.authority.score,
      need: bantScore.need.score,
      timeline: bantScore.timeline.score,
      shouldEscalate,
      escalationReason,
    },
  });

  // Step 8: Send the AI-generated response
  const smsResult = await sendSMS(fromNumber, responseMessage);

  if (!smsResult.success) {
    context.error(`Failed to send SMS response: ${smsResult.error}`);
  }

  // Step 9: Store the outbound response
  await storeConversation({
    tenantId: lead.tenantId,
    leadId: lead.id,
    userId: agent.id,
    type: 'SMS',
    body: responseMessage,
    subject: shouldEscalate
      ? `AI Response (Escalation: ${escalationReason})`
      : 'AI Response',
    status: smsResult.success ? 'sent' : 'failed',
    direction: 'outbound',
  });

  // Step 10: Handle escalation if needed
  if (shouldEscalate) {
    context.log(`Lead ${lead.id} flagged for escalation: ${escalationReason}`);
    await logActivity({
      tenantId: lead.tenantId,
      userId: agent.id,
      entityType: 'lead',
      entityId: lead.id,
      action: 'escalation_required',
      details: {
        reason: escalationReason,
        bantScore: bantScore.totalScore,
        lastMessage: messageBody.substring(0, 100),
      },
    });

    // In a production system, you might:
    // - Send email notification to agent
    // - Create a task/reminder
    // - Push notification to mobile app
    // - Update lead status to "needs attention"
  }

  context.log(
    `Successfully processed SMS for lead ${lead.id}. ` +
      `Score: ${bantScore.totalScore}, Escalate: ${shouldEscalate}`
  );

  return {
    success: true,
    leadId: lead.id,
    responseMessage,
    bantScore,
  };
}

/**
 * Format BANT assessment as readable notes
 */
function formatBANTAssessment(bantScore: BANTScore): string {
  return `BANT Score: ${bantScore.totalScore}/100

Budget (${bantScore.budget.score}/25): ${bantScore.budget.evidence}
Authority (${bantScore.authority.score}/25): ${bantScore.authority.evidence}
Need (${bantScore.need.score}/25): ${bantScore.need.evidence}
Timeline (${bantScore.timeline.score}/25): ${bantScore.timeline.evidence}

Assessment: ${bantScore.overallAssessment}

Summary: ${bantScore.conversationSummary}

Next Steps:
${bantScore.suggestedNextSteps.map((s) => `- ${s}`).join('\n')}`;
}

// Register the Azure Function
app.http('leadQualification', {
  methods: ['POST'],
  authLevel: 'anonymous', // Twilio needs to access without Azure auth
  route: 'twilio/sms',
  handler: handleTwilioWebhook,
});

// Health check endpoint
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    return {
      status: 200,
      jsonBody: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        function: 'leadQualification',
      },
    };
  },
});

export { handleTwilioWebhook, processIncomingSMS };
