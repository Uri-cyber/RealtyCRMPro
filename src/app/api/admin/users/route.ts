import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { requirePermission, requireRole, canManageUser } from '@/lib/rbac';

// Query params schema for filtering/searching
const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['SELLER', 'AGENT', 'MANAGER', 'ADMIN', 'all']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'role', 'createdAt', 'lastLoginAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Create user schema
const createUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  role: z.enum(['SELLER', 'AGENT', 'MANAGER', 'ADMIN']),
  phone: z.string().max(20).optional().nullable(),
  licenseNumber: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/admin/users - List all users with filtering, search, and pagination
 * Requires: ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require ADMIN role
    if (!requireRole(session, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { search, role, status, page, limit, sortBy, sortOrder } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: session.tenantId,
    };

    // Search filter (search by email, firstName, or lastName)
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      where.role = role;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    // 'all' status includes both active and inactive

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          profileImageUrl: true,
          licenseNumber: true,
          bio: true,
          timezone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              leads: true,
              properties: true,
              showings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await prisma.user.groupBy({
      by: ['role', 'isActive'],
      where: { tenantId: session.tenantId },
      _count: true,
    });

    const roleCounts: Record<string, number> = {};
    let activeCount = 0;
    let inactiveCount = 0;

    stats.forEach((stat) => {
      const roleKey = stat.role;
      roleCounts[roleKey] = (roleCounts[roleKey] || 0) + stat._count;
      if (stat.isActive) {
        activeCount += stat._count;
      } else {
        inactiveCount += stat._count;
      }
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        byRole: roleCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users - Create a new user directly
 * Requires: ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require ADMIN role
    if (!requireRole(session, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Check password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Cannot create user with role equal to or higher than own (unless ADMIN)
    if (!canManageUser(session.role, userData.role) && userData.role !== 'ADMIN') {
      // ADMINs can create other ADMINs
      if (session.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You cannot create a user with a role equal to or higher than your own' },
          { status: 403 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Check tenant user limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { maxUsers: true },
    });

    const currentUserCount = await prisma.user.count({
      where: {
        tenantId: session.tenantId,
        isActive: true,
      },
    });

    if (tenant && currentUserCount >= tenant.maxUsers) {
      return NextResponse.json(
        { error: 'User limit reached. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        tenantId: session.tenantId,
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone || null,
        licenseNumber: userData.licenseNumber || null,
        bio: userData.bio || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        licenseNumber: true,
        bio: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
