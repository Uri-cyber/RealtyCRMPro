import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendSMS, applyTemplate, isSMSConfigured } from '@/lib/sms';
import { z } from 'zod';

// Validation schema for bulk SMS
const bulkSMSSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead ID is required'),
  body: z.string().min(1, 'Message body is required').max(1600),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string()).optional(),
});

interface BulkSendResult {
  leadId: string;
  leadName: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * POST /api/communications/bulk
 * Sends bulk SMS messages to multiple leads
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if SMS is configured
    if (!isSMSConfigured()) {
      return NextResponse.json(
        { error: 'SMS service is not configured. Please set Twilio environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = bulkSMSSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadIds, body: messageBody, templateId, variables } = validationResult.data;

    // Fetch all leads
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        tenantId: session.tenantId,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 404 });
    }

    // Fetch template if provided
    let template = null;
    if (templateId) {
      template = await prisma.messageTemplate.findFirst({
        where: {
          id: templateId,
          userId: session.userId,
        },
      });
    }

    const results: BulkSendResult[] = [];
    const communicationsToCreate: {
      tenantId: string;
      leadId: string;
      userId: string;
      type: 'SMS';
      body: string;
      status: string;
      templateId?: string;
    }[] = [];

    // Send SMS to each lead
    for (const lead of leads) {
      const leadName = `${lead.firstName} ${lead.lastName}`;

      // Skip leads without phone numbers
      if (!lead.phone) {
        results.push({
          leadId: lead.id,
          leadName,
          success: false,
          error: 'Lead does not have a phone number',
        });
        continue;
      }

      // Apply template variables
      let finalBody = messageBody;
      if (template) {
        const templateVars = {
          name: leadName,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || '',
          phone: lead.phone,
          ...variables,
        };
        finalBody = applyTemplate(template.body, templateVars);
      } else if (variables) {
        // Apply variables to message body even without template
        const templateVars = {
          name: leadName,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || '',
          phone: lead.phone,
          ...variables,
        };
        finalBody = applyTemplate(messageBody, templateVars);
      }

      // Send SMS
      const sendResult = await sendSMS({
        to: lead.phone,
        body: finalBody,
      });

      results.push({
        leadId: lead.id,
        leadName,
        success: sendResult.success,
        messageId: sendResult.messageId,
        error: sendResult.error,
      });

      // Prepare communication record
      communicationsToCreate.push({
        tenantId: session.tenantId,
        leadId: lead.id,
        userId: session.userId,
        type: 'SMS',
        body: finalBody,
        status: sendResult.success ? 'sent' : 'failed',
        templateId: templateId,
      });
    }

    // Create all communication records
    await prisma.communication.createMany({
      data: communicationsToCreate,
    });

    // Update last activity for all successful sends
    const successfulLeadIds = results
      .filter((r) => r.success)
      .map((r) => r.leadId);

    if (successfulLeadIds.length > 0) {
      await prisma.lead.updateMany({
        where: {
          id: { in: successfulLeadIds },
        },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        entityType: 'communication',
        entityId: 'bulk',
        action: 'bulk_sms_sent',
        details: JSON.stringify({
          totalLeads: leadIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        }),
      },
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk SMS' },
      { status: 500 }
    );
  }
}
