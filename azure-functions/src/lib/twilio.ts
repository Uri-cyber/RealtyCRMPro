import twilio from 'twilio';
import crypto from 'crypto';

// Singleton Twilio client
let twilioClient: twilio.Twilio | null = null;

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    return null;
  }

  return { accountSid, authToken, phoneNumber };
}

function getTwilioClient(): twilio.Twilio | null {
  const config = getTwilioConfig();
  if (!config) {
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(config.accountSid, config.authToken);
  }

  return twilioClient;
}

// Twilio webhook payload interface
export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  SmsStatus?: string;
  NumSegments?: string;
  ApiVersion?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return phone;
  }

  // If already has country code (11 digits starting with 1 for US)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If US number without country code (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // For international numbers
  return `+${digits}`;
}

/**
 * Validate Twilio request signature
 * This ensures the webhook request actually came from Twilio
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const config = getTwilioConfig();
  if (!config) {
    console.error('Twilio not configured, cannot validate signature');
    return false;
  }

  // In development, optionally skip validation
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_VALIDATION === 'true') {
    return true;
  }

  return twilio.validateRequest(config.authToken, signature, url, params);
}

/**
 * Parse Twilio webhook body (form URL encoded)
 */
export function parseTwilioBody(body: string): TwilioWebhookPayload {
  const params = new URLSearchParams(body);
  const payload: Record<string, string> = {};

  params.forEach((value, key) => {
    payload[key] = value;
  });

  return payload as unknown as TwilioWebhookPayload;
}

/**
 * Send SMS response via Twilio
 */
export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  const client = getTwilioClient();
  const config = getTwilioConfig();

  if (!client || !config) {
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  const normalizedTo = normalizePhoneNumber(to);

  try {
    const message = await client.messages.create({
      body,
      to: normalizedTo,
      from: config.phoneNumber,
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    const err = error as Error;
    console.error('Twilio SMS error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Generate TwiML response for immediate reply
 * Can be used for simple acknowledgments
 */
export function generateTwiMLResponse(message?: string): string {
  if (message) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
  }

  // Empty response - we'll send async via API
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return getTwilioConfig() !== null;
}

/**
 * Hash a value for safe storage (e.g., for deduplication keys)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}
