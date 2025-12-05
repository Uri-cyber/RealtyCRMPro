import twilio from 'twilio';

// Environment variable validation
function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    return null;
  }

  return { accountSid, authToken, phoneNumber };
}

// Singleton Twilio client
let twilioClient: twilio.Twilio | null = null;

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

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  errorCode?: string;
}

export interface SMSStatusUpdate {
  messageSid: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Normalizes a phone number to E.164 format
 * Handles various input formats like (512) 555-1234, 512-555-1234, +1 512 555 1234
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  // If already has country code (11 digits starting with 1 for US)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If US number without country code (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If has leading + and proper length, use as-is
  if (hasPlus && digits.length >= 10) {
    return `+${digits}`;
  }

  // Return with + prefix if not already present
  return hasPlus ? `+${digits}` : `+${digits}`;
}

/**
 * Validates if a phone number is in a valid format for SMS
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // E.164 format: + followed by 10-15 digits
  return /^\+\d{10,15}$/.test(normalized);
}

/**
 * Sends an SMS message using Twilio
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  const client = getTwilioClient();
  const config = getTwilioConfig();

  if (!client || !config) {
    return {
      success: false,
      error: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
    };
  }

  // Validate and normalize phone number
  if (!isValidPhoneNumber(message.to)) {
    return {
      success: false,
      error: `Invalid phone number format: ${message.to}`,
    };
  }

  const normalizedTo = normalizePhoneNumber(message.to);

  // Validate message body
  if (!message.body || message.body.trim().length === 0) {
    return {
      success: false,
      error: 'Message body cannot be empty',
    };
  }

  // SMS has a character limit (160 for standard, 1600 for concatenated)
  if (message.body.length > 1600) {
    return {
      success: false,
      error: 'Message body exceeds maximum length of 1600 characters',
    };
  }

  try {
    const result = await client.messages.create({
      body: message.body,
      to: normalizedTo,
      from: message.from || config.phoneNumber,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error: unknown) {
    const twilioError = error as { code?: number; message?: string };
    console.error('Twilio SMS error:', error);

    return {
      success: false,
      error: twilioError.message || 'Failed to send SMS',
      errorCode: twilioError.code?.toString(),
    };
  }
}

/**
 * Sends bulk SMS messages to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string
): Promise<{ successful: SMSResult[]; failed: SMSResult[] }> {
  const successful: SMSResult[] = [];
  const failed: SMSResult[] = [];

  // Process in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((to) => sendSMS({ to, body }))
    );

    results.forEach((result, index) => {
      if (result.success) {
        successful.push({ ...result, messageId: result.messageId });
      } else {
        failed.push({ ...result, error: `Failed for ${batch[index]}: ${result.error}` });
      }
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { successful, failed };
}

/**
 * Retrieves the status of a sent SMS message
 */
export async function getSMSStatus(messageSid: string): Promise<SMSStatusUpdate | null> {
  const client = getTwilioClient();

  if (!client) {
    return null;
  }

  try {
    const message = await client.messages(messageSid).fetch();
    return {
      messageSid: message.sid,
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error) {
    console.error('Error fetching SMS status:', error);
    return null;
  }
}

/**
 * Checks if Twilio SMS service is properly configured
 */
export function isSMSConfigured(): boolean {
  return getTwilioConfig() !== null;
}

/**
 * Replaces template placeholders with actual values
 * Supports placeholders like {{name}}, {{property}}, {{date}}, {{time}}, {{agent}}
 */
export function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Extracts placeholders from a template string
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}
