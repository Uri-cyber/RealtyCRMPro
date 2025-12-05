import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken, setAuthCookie, JWTPayload } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

// Password strength validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  role: z.enum(['SELLER', 'AGENT']).default('AGENT'),
  inviteToken: z.string().optional(), // Optional invitation token to join existing team
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Check rate limit
  const rateLimitResult = checkRateLimit(clientIp, 'register', RATE_LIMIT_CONFIGS.register);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { email, password, firstName, lastName, role, inviteToken } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        {
          status: 409,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    let user;

    // Check if joining via invitation
    if (inviteToken) {
      const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

      const invitation = await prisma.invitation.findFirst({
        where: {
          token: hashedToken,
          status: 'PENDING',
          email, // Email must match invitation
        },
        include: { tenant: true },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation' },
          { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }

      if (new Date() > invitation.expiresAt) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        return NextResponse.json(
          { error: 'This invitation has expired' },
          { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }

      // Create user and mark invitation as accepted
      user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newUser = await tx.user.create({
          data: {
            tenantId: invitation.tenantId,
            email,
            passwordHash,
            firstName,
            lastName,
            role: invitation.role, // Use role from invitation, not from request
          },
        });

        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        });

        return newUser;
      });
    } else {
      // Create new tenant and user
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create tenant first (new user gets their own tenant)
        const tenant = await tx.tenant.create({
          data: {
            name: `${firstName} ${lastName}'s Team`,
            subscriptionTier: 'starter',
            maxUsers: 5, // Allow 5 users by default
            maxListings: 25,
          },
        });

        // Create user as ADMIN (first user of tenant is always admin)
        const newUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'ADMIN', // First user is always admin
          },
        });

        return { tenant, user: newUser };
      });

      user = result.user;
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
