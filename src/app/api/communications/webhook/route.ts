import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Validates Twilio webhook signature
 * This ensures the request is coming from Twilio and not a malicious actor
 */
function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  // Build the data string for signature validation
  const data = url + Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * POST /api/communications/webhook
 * Receives status updates from Twilio for SMS messages
 *
 * Twilio sends status updates for: queued, sent, delivered, undelivered, failed
 */
export async function POST(request: NextRequest) {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Get the Twilio signature from headers
    const twilioSignature = request.headers.get('X-Twilio-Signature');

    // Parse the form data from Twilio
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate signature in production
    if (process.env.NODE_ENV === 'production' && authToken && twilioSignature) {
      const url = request.url;
      const isValid = validateTwilioSignature(twilioSignature, url, params, authToken);

      if (!isValid) {
        console.error('Invalid Twilio signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`SMS Status Update: ${messageSid} - ${messageStatus}`);

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      queued: 'queued',
      sent: 'sent',
      delivered: 'delivered',
      undelivered: 'failed',
      failed: 'failed',
      receiving: 'receiving',
      received: 'received',
    };

    const mappedStatus = statusMap[messageStatus] || messageStatus;

    // Find and update the communication record
    // Note: We would need to store the Twilio message SID when sending
    // For now, this shows the webhook structure
    // In a production system, you'd have a messageSid field in the Communication model

    // Log the status update for debugging
    console.log({
      messageSid,
      status: mappedStatus,
      errorCode,
      errorMessage,
    });

    // Update delivery tracking timestamps based on status
    if (mappedStatus === 'delivered') {
      // Mark as opened if delivered (SMS doesn't have true open tracking)
      // You could update communications based on some correlation
    }

    // Respond with 200 OK to acknowledge receipt
    // Twilio will retry if it doesn't receive a 2xx response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    // Return 200 to prevent Twilio from retrying
    // Log the error for investigation
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  }
}

/**
 * GET /api/communications/webhook
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
