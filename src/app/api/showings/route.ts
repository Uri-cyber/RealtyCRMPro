import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/showings - List all showings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {
      tenantId: session.tenantId,
      ...(propertyId && { propertyId }),
      ...(leadId && { leadId }),
      ...(status && { status: status.toUpperCase() }),
      ...(startDate && endDate && {
        scheduledAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const showings = await prisma.showing.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            price: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ showings });
  } catch (error) {
    console.error('Get showings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showings' },
      { status: 500 }
    );
  }
}

// POST /api/showings - Create a new showing
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      leadId,
      scheduledAt,
      durationMinutes = 30,
      notes,
    } = body;

    // Validate required fields
    if (!propertyId || !leadId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Property ID, Lead ID, and scheduled time are required' },
        { status: 400 }
      );
    }

    // Create the showing
    const showing = await prisma.showing.create({
      data: {
        tenantId: session.tenantId,
        propertyId,
        leadId,
        agentId: session.userId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        notes,
      },
      include: {
        property: {
          select: {
            address: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update lead status to showing_scheduled
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'SHOWING_SCHEDULED',
        lastActivityAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        entityType: 'showing',
        entityId: showing.id,
        action: 'created',
        details: JSON.stringify({
          property: showing.property.address,
          lead: `${showing.lead.firstName} ${showing.lead.lastName}`,
          scheduledAt,
        }),
      },
    });

    return NextResponse.json({ showing }, { status: 201 });
  } catch (error) {
    console.error('Create showing error:', error);
    return NextResponse.json(
      { error: 'Failed to create showing' },
      { status: 500 }
    );
  }
}
