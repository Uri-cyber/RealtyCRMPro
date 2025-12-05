import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission, canManageUser } from '@/lib/rbac';

// Validation schema for updating user
const updateUserSchema = z.object({
  role: z.enum(['SELLER', 'AGENT', 'MANAGER', 'ADMIN']).optional(),
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: z.string().max(20).optional().nullable(),
  licenseNumber: z.string().max(50).optional().nullable(),
});

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/team/[userId] - Get a specific team member
 * Requires: team:read permission (MANAGER or ADMIN)
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

    const { userId } = await context.params;

    // Users can view their own profile, managers/admins can view all
    const isSelf = userId === session.userId;
    if (!isSelf && !requirePermission(session, 'team:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: session.tenantId,
        isActive: true,
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
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            leads: true,
            properties: true,
            showings: true,
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/[userId] - Update a team member's role or info
 * Requires: team:update permission (ADMIN only for role changes)
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
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions based on what's being updated
    const isSelf = userId === session.userId;

    // Role changes require team:update permission and hierarchy check
    if (updates.role) {
      if (!requirePermission(session, 'team:update')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to change roles' },
          { status: 403 }
        );
      }

      // Cannot change own role
      if (isSelf) {
        return NextResponse.json(
          { error: 'You cannot change your own role' },
          { status: 403 }
        );
      }

      // Can only manage users with lower role
      if (!canManageUser(session.role, targetUser.role)) {
        return NextResponse.json(
          { error: 'You cannot modify users with equal or higher role' },
          { status: 403 }
        );
      }

      // Cannot assign role equal to or higher than own
      if (!canManageUser(session.role, updates.role)) {
        return NextResponse.json(
          { error: 'You cannot assign a role equal to or higher than your own' },
          { status: 403 }
        );
      }
    }

    // For non-role updates on other users, require team:update permission
    if (!isSelf && !updates.role) {
      if (!requirePermission(session, 'team:update')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to update other users' },
          { status: 403 }
        );
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        profileImageUrl: true,
        licenseNumber: true,
      },
    });

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
 * DELETE /api/team/[userId] - Remove a team member (soft delete)
 * Requires: team:remove permission (ADMIN only)
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

    // Check permission
    if (!requirePermission(session, 'team:remove')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove team members' },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    // Cannot remove yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the team' },
        { status: 403 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: session.tenantId,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Can only remove users with lower role
    if (!canManageUser(session.role, targetUser.role)) {
      return NextResponse.json(
        { error: 'You cannot remove users with equal or higher role' },
        { status: 403 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Optionally reassign their leads and properties to the admin
    // For now, just unassign them
    await prisma.lead.updateMany({
      where: {
        assignedAgentId: userId,
        tenantId: session.tenantId,
      },
      data: { assignedAgentId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
