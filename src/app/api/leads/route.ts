import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Pagination constants
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100, // Prevent excessive data fetching
  MIN_LIMIT: 1,
} as const;

// AI Score constants for lead scoring algorithm
const AI_SCORE = {
  BASE: 30,
  EMAIL_BONUS: 20,
  PHONE_BONUS: 15,
  PROPERTY_INTEREST_BONUS: 15,
  REFERRAL_BONUS: 10,
  PAID_AD_BONUS: 5,
} as const;

// GET /api/leads - List all leads for the current user's tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    const source = searchParams.get('source');
    const page = Math.max(PAGINATION.MIN_LIMIT, parseInt(searchParams.get('page') || String(PAGINATION.DEFAULT_PAGE)));

    // Enforce pagination limits to prevent DoS
    const requestedLimit = parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_LIMIT));
    const limit = Math.min(Math.max(requestedLimit, PAGINATION.MIN_LIMIT), PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {
      tenantId: session.tenantId,
      ...(status && { status: status.toUpperCase() }),
      ...(propertyId && { propertyId }),
      ...(source && { source: source.toUpperCase() }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              showings: true,
              communications: true,
            },
          },
        },
        orderBy: [
          { aiScore: 'desc' },
          { lastActivityAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      propertyId,
      source = 'MANUAL',
      notes,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Calculate initial AI score based on available data
    let aiScore = AI_SCORE.BASE;
    if (email) aiScore += AI_SCORE.EMAIL_BONUS;
    if (phone) aiScore += AI_SCORE.PHONE_BONUS;
    if (propertyId) aiScore += AI_SCORE.PROPERTY_INTEREST_BONUS;
    if (source === 'REFERRAL') aiScore += AI_SCORE.REFERRAL_BONUS;
    if (source === 'FACEBOOK_AD' || source === 'GOOGLE_AD') aiScore += AI_SCORE.PAID_AD_BONUS;

    const lead = await prisma.lead.create({
      data: {
        tenantId: session.tenantId,
        firstName,
        lastName,
        email,
        phone,
        propertyId,
        assignedAgentId: session.userId,
        source,
        aiScore,
        notes,
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        entityType: 'lead',
        entityId: lead.id,
        action: 'created',
        details: JSON.stringify({ firstName, lastName, email, source }),
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads - Bulk update lead status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadIds, status } = body;

    if (!leadIds || !Array.isArray(leadIds) || !status) {
      return NextResponse.json(
        { error: 'Lead IDs and status are required' },
        { status: 400 }
      );
    }

    await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        tenantId: session.tenantId,
      },
      data: {
        status: status.toUpperCase(),
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update leads error:', error);
    return NextResponse.json(
      { error: 'Failed to update leads' },
      { status: 500 }
    );
  }
}
