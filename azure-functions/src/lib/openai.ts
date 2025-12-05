import OpenAI from 'openai';
import type { Lead, Communication } from './database';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// BANT Qualification Interface
export interface BANTScore {
  budget: {
    score: number; // 0-25
    evidence: string;
    qualified: boolean;
  };
  authority: {
    score: number; // 0-25
    evidence: string;
    qualified: boolean;
  };
  need: {
    score: number; // 0-25
    evidence: string;
    qualified: boolean;
  };
  timeline: {
    score: number; // 0-25
    evidence: string;
    qualified: boolean;
  };
  totalScore: number; // 0-100
  overallAssessment: string;
  suggestedNextSteps: string[];
  conversationSummary: string;
}

// Response from AI qualification
export interface QualificationResponse {
  bantScore: BANTScore;
  responseMessage: string;
  shouldEscalate: boolean;
  escalationReason?: string;
}

const SYSTEM_PROMPT = `You are an AI assistant for a real estate CRM system. Your role is to:

1. Engage with potential home buyers/renters via SMS in a friendly, professional manner
2. Qualify leads using the BANT framework (Budget, Authority, Need, Timeline)
3. Gather information naturally through conversation without being pushy
4. Provide helpful responses while collecting qualification data

BANT Qualification Criteria for Real Estate:

BUDGET (0-25 points):
- 25: Clear budget stated, pre-approved for mortgage, or has cash
- 20: Has general price range in mind, working with lender
- 15: Has discussed budget, seems realistic
- 10: Vague about budget but willing to discuss
- 5: Reluctant to discuss budget
- 0: No budget information gathered

AUTHORITY (0-25 points):
- 25: Primary decision maker, ready to make offers
- 20: Decision maker but consulting with spouse/partner
- 15: Part of decision-making team
- 10: Needs approval from others
- 5: Just exploring for someone else
- 0: No authority information gathered

NEED (0-25 points):
- 25: Urgent need (relocation, growing family, lease ending soon)
- 20: Clear need with specific requirements
- 15: Has reasons to move, flexible on timeline
- 10: Interested but no pressing need
- 5: Casual browser
- 0: No need information gathered

TIMELINE (0-25 points):
- 25: Ready to buy within 30 days
- 20: Looking to buy within 1-3 months
- 15: Planning to buy within 3-6 months
- 10: Within the next year
- 5: More than a year out or undecided
- 0: No timeline information gathered

Response Guidelines:
- Keep SMS responses under 160 characters when possible (max 320)
- Be conversational and warm, not salesy
- Ask one question at a time
- Acknowledge their responses before asking follow-up questions
- If they mention specific properties, acknowledge that interest
- If they seem ready to schedule a showing, suggest that option
- If they express urgency or frustration, flag for human escalation`;

/**
 * Build conversation context from history
 */
function buildConversationContext(
  lead: Lead,
  conversationHistory: Communication[],
  newMessage: string
): string {
  const leadInfo = `
Lead Information:
- Name: ${lead.firstName} ${lead.lastName}
- Phone: ${lead.phone || 'Unknown'}
- Email: ${lead.email || 'Unknown'}
- Source: ${lead.source}
- Current Status: ${lead.status}
- Current AI Score: ${lead.aiScore}
- Interested Properties: ${lead.interestedProperties || 'None specified'}
- Notes: ${lead.notes || 'None'}
`;

  const history = conversationHistory
    .slice()
    .reverse() // Chronological order
    .map((msg) => {
      const direction = msg.subject?.includes('Inbound') ? 'LEAD' : 'AGENT';
      return `${direction}: ${msg.body}`;
    })
    .join('\n');

  return `${leadInfo}

Previous Conversation:
${history || 'No previous conversation'}

New Message from Lead:
LEAD: ${newMessage}`;
}

/**
 * Qualify a lead using BANT framework based on conversation
 */
export async function qualifyLead(
  lead: Lead,
  conversationHistory: Communication[],
  newMessage: string
): Promise<QualificationResponse> {
  const client = getOpenAIClient();

  const conversationContext = buildConversationContext(lead, conversationHistory, newMessage);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${conversationContext}

Based on this conversation, please provide:
1. An updated BANT score assessment
2. A natural SMS response to continue qualifying this lead
3. Whether this should be escalated to a human agent

Respond in JSON format:
{
  "bantScore": {
    "budget": { "score": number, "evidence": "string", "qualified": boolean },
    "authority": { "score": number, "evidence": "string", "qualified": boolean },
    "need": { "score": number, "evidence": "string", "qualified": boolean },
    "timeline": { "score": number, "evidence": "string", "qualified": boolean },
    "totalScore": number,
    "overallAssessment": "string",
    "suggestedNextSteps": ["string"],
    "conversationSummary": "string"
  },
  "responseMessage": "string (keep under 320 chars for SMS)",
  "shouldEscalate": boolean,
  "escalationReason": "string or null"
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content) as QualificationResponse;

  // Validate and clamp scores
  const bantScore = parsed.bantScore;
  bantScore.budget.score = Math.min(25, Math.max(0, bantScore.budget.score));
  bantScore.authority.score = Math.min(25, Math.max(0, bantScore.authority.score));
  bantScore.need.score = Math.min(25, Math.max(0, bantScore.need.score));
  bantScore.timeline.score = Math.min(25, Math.max(0, bantScore.timeline.score));
  bantScore.totalScore =
    bantScore.budget.score +
    bantScore.authority.score +
    bantScore.need.score +
    bantScore.timeline.score;

  // Ensure response message is not too long
  if (parsed.responseMessage.length > 320) {
    parsed.responseMessage = parsed.responseMessage.substring(0, 317) + '...';
  }

  return parsed;
}

/**
 * Generate a welcome message for a new lead
 */
export async function generateWelcomeMessage(lead: Lead): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate a friendly welcome SMS message for a new real estate lead.

Lead Info:
- Name: ${lead.firstName} ${lead.lastName}
- Source: ${lead.source}
- Interested Properties: ${lead.interestedProperties || 'Not specified'}

Requirements:
- Keep under 160 characters
- Be warm and professional
- Mention their name
- Ask an open-ended question to start qualification

Respond with just the message text, no quotes or formatting.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  const message = response.choices[0]?.message?.content?.trim() || '';
  return message.length > 160 ? message.substring(0, 157) + '...' : message;
}

/**
 * Determine suggested lead status based on BANT score
 */
export function suggestLeadStatus(bantScore: BANTScore): string {
  const score = bantScore.totalScore;

  // Count how many BANT criteria are qualified
  const qualifiedCount = [
    bantScore.budget.qualified,
    bantScore.authority.qualified,
    bantScore.need.qualified,
    bantScore.timeline.qualified,
  ].filter(Boolean).length;

  if (score >= 80 && qualifiedCount >= 3) {
    return 'SHOWING_SCHEDULED'; // Hot lead, ready for showing
  } else if (score >= 60 && qualifiedCount >= 2) {
    return 'CONTACTED'; // Warm lead, keep nurturing
  } else if (score >= 40) {
    return 'CONTACTED'; // Engaging but needs more qualification
  } else {
    return 'NEW'; // Still early stage
  }
}
