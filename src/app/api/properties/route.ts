import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Pagination constants
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100, // Prevent excessive data fetching
  MIN_LIMIT: 1,
} as const;

// GET /api/properties - List all properties for the current user's tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(PAGINATION.MIN_LIMIT, parseInt(searchParams.get('page') || String(PAGINATION.DEFAULT_PAGE)));

    // Enforce pagination limits to prevent DoS
    const requestedLimit = parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_LIMIT));
    const limit = Math.min(Math.max(requestedLimit, PAGINATION.MIN_LIMIT), PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {
      tenantId: session.tenantId,
      ...(status && { status: status.toUpperCase() }),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              leads: true,
              showings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      sqft,
      price,
      description,
      mlsNumber,
      yearBuilt,
      lotSize,
      propertyType = 'SINGLE_FAMILY',
      photoUrls = [],
      features = [],
    } = body;

    // Validate required fields
    if (!address || !city || !state || !zipCode || !bedrooms || !bathrooms || !sqft || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        address,
        city,
        state,
        zipCode,
        bedrooms,
        bathrooms,
        sqft,
        price,
        description,
        mlsNumber,
        yearBuilt,
        lotSize,
        propertyType,
        photoUrls: JSON.stringify(photoUrls),
        features: JSON.stringify(features),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        entityType: 'property',
        entityId: property.id,
        action: 'created',
        details: JSON.stringify({ address, city, state, price }),
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
