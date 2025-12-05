import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSMSConfigured } from '@/lib/sms';

/**
 * GET /api/communications/status
 * Returns the configuration status of communication services
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check SMS configuration
    const smsConfigured = isSMSConfigured();

    // Check Email configuration (SendGrid)
    const emailConfigured = !!(
      process.env.SENDGRID_API_KEY &&
      process.env.EMAIL_FROM
    );

    return NextResponse.json({
      services: {
        sms: {
          configured: smsConfigured,
          provider: 'Twilio',
          features: smsConfigured
            ? ['send', 'receive', 'status_tracking', 'bulk_send']
            : [],
        },
        email: {
          configured: emailConfigured,
          provider: 'SendGrid',
          features: emailConfigured
            ? ['send', 'templates', 'tracking']
            : [],
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking communication status:', error);
    return NextResponse.json(
      { error: 'Failed to check communication status' },
      { status: 500 }
    );
  }
}
