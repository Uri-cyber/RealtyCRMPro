import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client in Azure Functions
// Prevents connection exhaustion during cold starts
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prismaInstance;
}

// Interface matching the Prisma Lead model
export interface Lead {
  id: string;
  tenantId: string;
  propertyId: string | null;
  assignedAgentId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: string;
  aiScore: number;
  status: string;
  interestedProperties: string | null;
  notes: string | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Communication records
export interface Communication {
  id: string;
  tenantId: string;
  leadId: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'CALL';
  subject: string | null;
  body: string;
  templateId: string | null;
  sentAt: Date;
  openedAt: Date | null;
  clickedAt: Date | null;
  status: string;
}

/**
 * Find a lead by phone number across all tenants
 * Returns the lead with the most recent activity if multiple matches
 */
export async function findLeadByPhone(phone: string): Promise<Lead | null> {
  const prisma = getPrismaClient();

  // Normalize phone to digits only for matching
  const normalizedPhone = phone.replace(/\D/g, '');
  const phoneVariants = [
    normalizedPhone,
    `+${normalizedPhone}`,
    `+1${normalizedPhone}`,
    normalizedPhone.slice(-10), // Last 10 digits
  ];

  const lead = await prisma.lead.findFirst({
    where: {
      phone: {
        in: phoneVariants,
      },
    },
    orderBy: {
      lastActivityAt: 'desc',
    },
  });

  return lead as Lead | null;
}

/**
 * Get recent conversations for a lead (last N messages)
 */
export async function getLeadConversationHistory(
  leadId: string,
  limit: number = 10
): Promise<Communication[]> {
  const prisma = getPrismaClient();

  const communications = await prisma.communication.findMany({
    where: {
      leadId,
      type: 'SMS',
    },
    orderBy: {
      sentAt: 'desc',
    },
    take: limit,
  });

  return communications as Communication[];
}

/**
 * Store a new communication record
 */
export async function storeConversation(data: {
  tenantId: string;
  leadId: string;
  userId: string;
  type: 'SMS' | 'EMAIL' | 'CALL';
  body: string;
  subject?: string;
  status?: string;
  direction?: 'inbound' | 'outbound';
}): Promise<Communication> {
  const prisma = getPrismaClient();

  const communication = await prisma.communication.create({
    data: {
      tenantId: data.tenantId,
      leadId: data.leadId,
      userId: data.userId,
      type: data.type,
      body: data.body,
      subject: data.subject || (data.direction === 'inbound' ? 'Inbound SMS' : 'AI Response'),
      status: data.status || 'received',
      sentAt: new Date(),
    },
  });

  return communication as Communication;
}

/**
 * Update lead AI score and status
 */
export async function updateLeadScore(
  leadId: string,
  score: number,
  status?: string,
  notes?: string
): Promise<Lead> {
  const prisma = getPrismaClient();

  const updateData: Record<string, unknown> = {
    aiScore: Math.min(100, Math.max(0, score)), // Clamp between 0-100
    lastActivityAt: new Date(),
  };

  if (status) {
    updateData.status = status;
  }

  if (notes) {
    // Append to existing notes
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { notes: true },
    });

    const existingNotes = existingLead?.notes || '';
    const timestamp = new Date().toISOString();
    updateData.notes = existingNotes
      ? `${existingNotes}\n\n[${timestamp}] AI Assessment:\n${notes}`
      : `[${timestamp}] AI Assessment:\n${notes}`;
  }

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  return lead as Lead;
}

/**
 * Get the assigned agent for a lead, or the first admin/agent in the tenant
 */
export async function getLeadAgent(lead: Lead): Promise<{ id: string; tenantId: string } | null> {
  const prisma = getPrismaClient();

  // If lead has an assigned agent, use that
  if (lead.assignedAgentId) {
    const agent = await prisma.user.findUnique({
      where: { id: lead.assignedAgentId },
      select: { id: true, tenantId: true },
    });
    if (agent) return agent;
  }

  // Otherwise, find the first active agent/admin in the tenant
  const agent = await prisma.user.findFirst({
    where: {
      tenantId: lead.tenantId,
      isActive: true,
      role: { in: ['ADMIN', 'MANAGER', 'AGENT'] },
    },
    orderBy: [
      { role: 'asc' }, // ADMIN first
      { createdAt: 'asc' },
    ],
    select: { id: true, tenantId: true },
  });

  return agent;
}

/**
 * Log activity for audit trail
 */
export async function logActivity(data: {
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const prisma = getPrismaClient();

  await prisma.activityLog.create({
    data: {
      tenantId: data.tenantId,
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      details: data.details ? JSON.stringify(data.details) : null,
    },
  });
}
