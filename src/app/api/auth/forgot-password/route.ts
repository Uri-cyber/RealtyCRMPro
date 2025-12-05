import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Check rate limit - strict rate limiting for password reset to prevent abuse
  const rateLimitResult = checkRateLimit(clientIp, 'forgotPassword', RATE_LIMIT_CONFIGS.forgotPassword);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many password reset requests. Please try again later.',
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
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { email } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we don't want to reveal that
    if (!user) {
      // Log without exposing email (use hashed identifier for correlation if needed)
      console.log('Password reset requested for non-existent account');
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive password reset instructions.',
        },
        { headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Store the hashed token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    // Build reset URL for email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // TODO: Integrate with SendGrid to send actual reset email
    // In development, the reset URL should be retrieved from database or email service logs
    // NEVER expose the token in API responses - this is a security vulnerability
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Reset your password',
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
    // });

    // Log without sensitive data for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      // In a real development environment, you would check your email service
      // or database directly. For local testing, you can temporarily enable this:
      console.log('[DEV ONLY] Password reset initiated for user ID:', user.id);
      // Uncomment only for local testing, never in any deployed environment:
      // console.log('[DEV ONLY] Reset URL:', resetUrl);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
