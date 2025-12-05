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

export function calculateLeadScore(lead: {
  emailOpens?: number;
  propertyViews?: number;
  showingsAttended?: number;
  daysActive?: number;
}): number {
  let score = 0;

  // Email engagement (max 20 points)
  score += Math.min((lead.emailOpens || 0) * 5, 20);

  // Property interest (max 30 points)
  score += Math.min((lead.propertyViews || 0) * 10, 30);

  // Showings (max 30 points)
  score += Math.min((lead.showingsAttended || 0) * 15, 30);

  // Recency bonus (max 20 points)
  const daysActive = lead.daysActive || 0;
  if (daysActive <= 7) score += 20;
  else if (daysActive <= 14) score += 15;
  else if (daysActive <= 30) score += 10;
  else if (daysActive <= 60) score += 5;

  return Math.min(score, 100);
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
