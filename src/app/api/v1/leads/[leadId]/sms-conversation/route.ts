import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Pagination constants for SMS conversation
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// Validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/leads/[leadId]/sms-conversation
 * Fetches SMS conversation history for a specific lead
 *
 * Features:
 * - JWT authentication required
 * - Multi-tenant filtering (users can only access their tenant's data)
 * - Paginated message history (default: last 50 messages)
 * - Includes lead score and activity trend
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Messages per page (default: 50, max: 100)
 *
 * Response:
 * - lead: Lead details with score and trend
 * - messages: SMS conversation history
 * - pagination: Pagination metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    // JWT validation
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid authentication token required' },
        { status: 401 }
      );
    }

    const { leadId } = await params;

    // Validate leadId format
    if (!leadId || !UUID_REGEX.test(leadId)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') || PAGINATION.DEFAULT_PAGE,
      limit: searchParams.get('limit') || PAGINATION.DEFAULT_LIMIT,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    // Multi-tenant filtering: Fetch lead ensuring it belongs to the user's tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: session.tenantId, // Multi-tenant filter
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        aiScore: true,          // Lead score
        lastActivityAt: true,   // Activity trend
        createdAt: true,
        updatedAt: true,
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Lead not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch SMS messages for this lead with pagination
    const [messages, totalMessages] = await Promise.all([
      prisma.communication.findMany({
        where: {
          leadId: leadId,
          tenantId: session.tenantId, // Multi-tenant filter
          type: 'SMS',                // Only SMS messages
        },
        select: {
          id: true,
          body: true,
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
          sentAt: 'desc', // Most recent first
        },
        skip,
        take: limit,
      }),
      prisma.communication.count({
        where: {
          leadId: leadId,
          tenantId: session.tenantId,
          type: 'SMS',
        },
      }),
    ]);

    // Calculate trend based on recent activity
    const now = new Date();
    const lastActivity = lead.lastActivityAt ? new Date(lead.lastActivityAt) : null;
    const daysSinceActivity = lastActivity
      ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine trend direction based on activity recency
    let trend: 'hot' | 'warm' | 'cold' | 'inactive';
    if (daysSinceActivity === null) {
      trend = 'inactive';
    } else if (daysSinceActivity <= 1) {
      trend = 'hot';
    } else if (daysSinceActivity <= 7) {
      trend = 'warm';
    } else if (daysSinceActivity <= 30) {
      trend = 'cold';
    } else {
      trend = 'inactive';
    }

    const totalPages = Math.ceil(totalMessages / limit);

    return NextResponse.json({
      lead: {
        ...lead,
        score: lead.aiScore,
        trend: {
          status: trend,
          lastActivityAt: lead.lastActivityAt,
          daysSinceActivity,
        },
      },
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching SMS conversation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch SMS conversation' },
      { status: 500 }
    );
  }
}
