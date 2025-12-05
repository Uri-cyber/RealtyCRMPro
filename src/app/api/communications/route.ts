import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendSMS, applyTemplate, isSMSConfigured } from '@/lib/sms';
import { z } from 'zod';

// Validation schema for sending a message
const sendMessageSchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum(['EMAIL', 'SMS', 'CALL']),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.string()).optional(),
});

// Validation schema for query params
const getMessagesSchema = z.object({
  leadId: z.string().uuid().optional(),
  type: z.enum(['EMAIL', 'SMS', 'CALL']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/communications
 * Fetches communications with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = getMessagesSchema.safeParse({
      leadId: searchParams.get('leadId') || undefined,
      type: searchParams.get('type') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, type, page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      tenantId: string;
      leadId?: string;
      type?: 'EMAIL' | 'SMS' | 'CALL';
    } = {
      tenantId: session.tenantId,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    if (type) {
      where.type = type;
    }

    // Fetch communications with related data
    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    return NextResponse.json({
      communications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communications
 * Sends a new communication (SMS, EMAIL, or logs a CALL)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = sendMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, type, subject, body: messageBody, templateId, variables } = validationResult.data;

    // Fetch the lead to get contact info
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: session.tenantId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // If using a template, fetch and apply it
    let finalBody = messageBody;
    let finalSubject = subject;

    if (templateId) {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id: templateId,
          userId: session.userId,
        },
      });

      if (template) {
        const templateVars = {
          name: `${lead.firstName} ${lead.lastName}`,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || '',
          phone: lead.phone || '',
          ...variables,
        };

        finalBody = applyTemplate(template.body, templateVars);
        if (template.subject) {
          finalSubject = applyTemplate(template.subject, templateVars);
        }
      }
    }

    // Handle different communication types
    let sendResult: { success: boolean; messageId?: string; error?: string } = { success: true };

    if (type === 'SMS') {
      // Check if SMS is configured
      if (!isSMSConfigured()) {
        return NextResponse.json(
          { error: 'SMS service is not configured. Please set Twilio environment variables.' },
          { status: 503 }
        );
      }

      // Validate lead has phone number
      if (!lead.phone) {
        return NextResponse.json(
          { error: 'Lead does not have a phone number' },
          { status: 400 }
        );
      }

      // Send SMS
      sendResult = await sendSMS({
        to: lead.phone,
        body: finalBody,
      });

      if (!sendResult.success) {
        return NextResponse.json(
          { error: sendResult.error || 'Failed to send SMS' },
          { status: 500 }
        );
      }
    } else if (type === 'EMAIL') {
      // Email sending would be implemented with SendGrid
      // For now, we'll just log it and mark as sent
      // TODO: Implement SendGrid integration
      sendResult = { success: true, messageId: `email_${Date.now()}` };
    }

    // Create communication record
    const communication = await prisma.communication.create({
      data: {
        tenantId: session.tenantId,
        leadId,
        userId: session.userId,
        type,
        subject: finalSubject,
        body: finalBody,
        templateId,
        status: sendResult.success ? 'sent' : 'failed',
        sentAt: new Date(),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        entityType: 'communication',
        entityId: communication.id,
        action: 'sent',
        details: JSON.stringify({
          type,
          leadId,
          messageId: sendResult.messageId,
        }),
      },
    });

    // Update lead's last activity
    await prisma.lead.update({
      where: { id: leadId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      communication,
      messageId: sendResult.messageId,
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    return NextResponse.json(
      { error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}
