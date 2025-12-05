import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { requireRole, canManageUser } from '@/lib/rbac';

// Update user schema
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  role: z.enum(['SELLER', 'AGENT', 'MANAGER', 'ADMIN']).optional(),
  phone: z.string().max(20).optional().nullable(),
  licenseNumber: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  timezone: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/users/[userId] - Get detailed user information
 * Requires: ADMIN role
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!requireRole(session, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: session.tenantId,
      },
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
            communications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent activity summary
    const recentLeads = await prisma.lead.count({
      where: {
        assignedAgentId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const recentShowings = await prisma.showing.count({
      where: {
        agentId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      user,
      recentActivity: {
        leadsLast30Days: recentLeads,
        showingsLast30Days: recentShowings,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[userId] - Update user (including activate/deactivate)
 * Requires: ADMIN role
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!requireRole(session, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await context.params;
    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: session.tenantId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isSelf = userId === session.userId;

    // Prevent self-deactivation
    if (isSelf && updates.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 403 }
      );
    }

    // Prevent self-role change
    if (isSelf && updates.role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Role hierarchy checks for non-self updates
    if (!isSelf) {
      // Can only manage users with lower role (except ADMIN can manage everyone including other ADMINs)
      if (session.role !== 'ADMIN' && !canManageUser(session.role, targetUser.role)) {
        return NextResponse.json(
          { error: 'You cannot modify users with equal or higher role' },
          { status: 403 }
        );
      }

      // Cannot assign role higher than own (unless ADMIN)
      if (updates.role && session.role !== 'ADMIN' && !canManageUser(session.role, updates.role)) {
        return NextResponse.json(
          { error: 'You cannot assign a role equal to or higher than your own' },
          { status: 403 }
        );
      }
    }

    // If reactivating, check user limits
    if (updates.isActive === true && !targetUser.isActive) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { maxUsers: true },
      });

      const currentActiveUsers = await prisma.user.count({
        where: {
          tenantId: session.tenantId,
          isActive: true,
        },
      });

      if (tenant && currentActiveUsers >= tenant.maxUsers) {
        return NextResponse.json(
          { error: 'Cannot reactivate user. User limit reached.' },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.licenseNumber !== undefined) updateData.licenseNumber = updates.licenseNumber;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    // Handle password update
    if (updates.password) {
      const passwordValidation = validatePasswordStrength(updates.password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { error: 'Password does not meet requirements', details: passwordValidation.errors },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(updates.password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        licenseNumber: true,
        bio: true,
        timezone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If deactivating, unassign leads
    if (updates.isActive === false) {
      await prisma.lead.updateMany({
        where: {
          assignedAgentId: userId,
          tenantId: session.tenantId,
        },
        data: { assignedAgentId: null },
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId] - Permanently delete a user
 * Requires: ADMIN role
 * Note: This is a hard delete - use PATCH with isActive: false for soft delete
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!requireRole(session, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    // Cannot delete yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 403 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: session.tenantId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete instead of hard delete for data integrity
    await prisma.$transaction(async (tx) => {
      // Unassign leads
      await tx.lead.updateMany({
        where: {
          assignedAgentId: userId,
          tenantId: session.tenantId,
        },
        data: { assignedAgentId: null },
      });

      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'User has been deactivated',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
