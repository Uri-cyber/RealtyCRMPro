import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { requirePermission, canManageUser } from '@/lib/rbac';

// Validation schema for creating invitation
const inviteSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  role: z.enum(['SELLER', 'AGENT', 'MANAGER']).default('AGENT'),
});

// Validation schema for accepting invitation
const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

/**
 * POST /api/team/invite - Create a new invitation
 * Requires: team:invite permission (MANAGER or ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!requirePermission(session, 'team:invite')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = inviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Check if the inviter can assign this role
    if (!canManageUser(session.role, role)) {
      return NextResponse.json(
        { error: 'You cannot invite users with equal or higher role than yours' },
        { status: 403 }
      );
    }

    // Check if user already exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Check tenant's user limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        users: { where: { isActive: true } },
        invitations: { where: { status: 'PENDING' } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const totalUsers = tenant.users.length + tenant.invitations.length;
    if (totalUsers >= tenant.maxUsers) {
      return NextResponse.json(
        {
          error: 'User limit reached. Upgrade your subscription to add more team members.',
          currentUsers: tenant.users.length,
          pendingInvitations: tenant.invitations.length,
          maxUsers: tenant.maxUsers,
        },
        { status: 403 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        tenantId: session.tenantId,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation for this email is already pending' },
        { status: 409 }
      );
    }

    // Generate invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: session.tenantId,
        email,
        role,
        token: hashedToken,
        invitedBy: session.userId,
        expiresAt,
      },
      include: {
        inviter: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // TODO: Send invitation email with rawToken
    // For now, return the token in response (in production, only send via email)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${rawToken}`;

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteUrl, // Remove in production - send via email only
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/team/invite - Accept an invitation and create account
 * Public endpoint - no auth required
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = acceptInviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { token, firstName, lastName, password } = validationResult.data;

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: hashedToken,
        status: 'PENDING',
      },
      include: {
        tenant: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and update invitation in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          email: invitation.email,
          passwordHash,
          firstName,
          lastName,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please login to continue.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
