import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';

/**
 * GET /api/team - List all team members in the tenant
 * Requires: team:read permission (MANAGER or ADMIN)
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!requirePermission(session, 'team:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view team' },
        { status: 403 }
      );
    }

    // Get all team members in the tenant
    const teamMembers = await prisma.user.findMany({
      where: {
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
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'desc' },
        { firstName: 'asc' },
      ],
    });

    // Get tenant info for subscription limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        maxUsers: true,
      },
    });

    return NextResponse.json({
      team: teamMembers,
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
        subscriptionTier: tenant?.subscriptionTier,
        maxUsers: tenant?.maxUsers,
        currentUsers: teamMembers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
