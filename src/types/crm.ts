// CRM Types for RealtyCRM Pro

// Communication Types
export type CommunicationType = 'EMAIL' | 'SMS' | 'CALL';

export type CommunicationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'received';

export interface Communication {
  id: string;
  tenantId: string;
  leadId: string;
  userId: string;
  type: CommunicationType;
  subject?: string;
  body: string;
  templateId?: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  status: CommunicationStatus;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  template?: {
    id: string;
    name: string;
  };
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  subject?: string;
  body: string;
  type: CommunicationType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  leadId: string;
  type: CommunicationType;
  subject?: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SendMessageResponse {
  success: boolean;
  communication: Communication;
  messageId?: string;
}

export interface BulkSMSRequest {
  leadIds: string[];
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkSMSResult {
  leadId: string;
  leadName: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSMSResponse {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: BulkSMSResult[];
}

export interface CommunicationServiceStatus {
  services: {
    sms: {
      configured: boolean;
      provider: string;
      features: string[];
    };
    email: {
      configured: boolean;
      provider: string;
      features: string[];
    };
  };
  timestamp: string;
}

export interface CreateTemplateRequest {
  name: string;
  subject?: string;
  body: string;
  type: CommunicationType;
  isDefault?: boolean;
}

export interface Conversation {
  id: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: 'email' | 'sms';
  property?: string;
}

export enum LeadStatus {
  NEW = 'New Leads',
  CONTACTED = 'Contacted',
  SHOWING = 'Showing Scheduled',
  OFFER = 'Offer Received',
  CLOSED = 'Closed'
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: 'Website' | 'Referral' | 'Ad' | 'Zillow';
  status: LeadStatus;
  aiScore: number; // 0-100
  createdAt: string;
  assignedAgent: string;
  interestedPropertyId?: string;
  lastActivity?: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: 'For Sale' | 'Under Contract' | 'Closed';
  image: string;
  views: number;
  leads: number;
}

export interface Showing {
  id: string;
  propertyId: string;
  leadName: string;
  date: number; // Day of the month for the mock calendar (Oct 2023)
  time: string;
  duration: number; // minutes
  status: 'Confirmed' | 'Pending' | 'Completed';
  address: string;
}

export type ViewState = 'DASHBOARD' | 'PIPELINE' | 'PROPERTIES' | 'CALENDAR' | 'REPORTS';

export interface ChartDataPoint {
  name: string;
  leads?: number;
  visitors?: number;
  revenue?: number;
  projected?: number;
}

export interface LeadSourceDataPoint {
  name: string;
  value: number;
  color: string;
}
