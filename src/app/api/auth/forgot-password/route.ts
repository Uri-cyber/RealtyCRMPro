import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we don't want to reveal that
    if (!user) {
      // Log for debugging but don't tell client
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
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
    // Note: You'll need to add these fields to the User model in Prisma schema:
    // resetToken String?
    // resetTokenExpiry DateTime?
    // For now, we'll just log this - in production you'd save to DB
    console.log('Password reset requested for:', {
      email: user.email,
      userId: user.id,
      tokenHash: resetTokenHash,
      expiry: resetTokenExpiry,
    });

    // In production, you would:
    // 1. Save the token hash to the database:
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     resetToken: resetTokenHash,
    //     resetTokenExpiry: resetTokenExpiry,
    //   },
    // });
    //
    // 2. Send email with reset link:
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Reset your password',
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
    // });

    // For development, log the reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    console.log('Password reset URL (dev only):', resetUrl);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
      // Only include in development
      ...(process.env.NODE_ENV === 'development' && { devResetUrl: resetUrl }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
