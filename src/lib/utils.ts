import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(d);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Lead scoring constants
const LEAD_SCORE = {
  EMAIL_OPEN_POINTS: 5,
  EMAIL_OPEN_MAX: 20,
  PROPERTY_VIEW_POINTS: 10,
  PROPERTY_VIEW_MAX: 30,
  SHOWING_POINTS: 15,
  SHOWING_MAX: 30,
  RECENCY_7_DAYS: 20,
  RECENCY_14_DAYS: 15,
  RECENCY_30_DAYS: 10,
  RECENCY_60_DAYS: 5,
  MAX_SCORE: 100,
} as const;

export function calculateLeadScore(lead: {
  emailOpens?: number;
  propertyViews?: number;
  showingsAttended?: number;
  daysActive?: number;
}): number {
  let score = 0;

  // Email engagement (max 20 points)
  score += Math.min((lead.emailOpens || 0) * LEAD_SCORE.EMAIL_OPEN_POINTS, LEAD_SCORE.EMAIL_OPEN_MAX);

  // Property interest (max 30 points)
  score += Math.min((lead.propertyViews || 0) * LEAD_SCORE.PROPERTY_VIEW_POINTS, LEAD_SCORE.PROPERTY_VIEW_MAX);

  // Showings (max 30 points)
  score += Math.min((lead.showingsAttended || 0) * LEAD_SCORE.SHOWING_POINTS, LEAD_SCORE.SHOWING_MAX);

  // Recency bonus (max 20 points)
  const daysActive = lead.daysActive || 0;
  if (daysActive <= 7) score += LEAD_SCORE.RECENCY_7_DAYS;
  else if (daysActive <= 14) score += LEAD_SCORE.RECENCY_14_DAYS;
  else if (daysActive <= 30) score += LEAD_SCORE.RECENCY_30_DAYS;
  else if (daysActive <= 60) score += LEAD_SCORE.RECENCY_60_DAYS;

  return Math.min(score, LEAD_SCORE.MAX_SCORE);
}

export function getPipelineStageColor(stage: string): string {
  const colors: Record<string, string> = {
    new: 'pipeline-new',
    contacted: 'pipeline-contacted',
    showing_scheduled: 'pipeline-scheduling',
    offer_received: 'pipeline-offer',
    closed: 'pipeline-closed',
  };
  return colors[stage] || 'pipeline-new';
}

export function getPropertyStatusBadge(status: string): { label: string; variant: string } {
  const statuses: Record<string, { label: string; variant: string }> = {
    for_sale: { label: 'For Sale', variant: 'badge-primary' },
    under_contract: { label: 'Under Contract', variant: 'badge-warning' },
    closed: { label: 'Closed', variant: 'badge-success' },
  };
  return statuses[status] || { label: status, variant: 'badge-neutral' };
}

/**
 * Generates a cryptographically secure unique ID
 * Uses crypto.randomUUID() which is available in modern browsers and Node.js
 */
export function generateId(): string {
  // Use crypto.randomUUID() for cryptographically secure IDs
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  // Uses crypto.getRandomValues for better randomness than Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    // Format as UUID v4
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback - not cryptographically secure
  // Should rarely be needed in modern environments
  console.warn('Using non-cryptographic ID generation');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
