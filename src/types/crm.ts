// CRM Types for RealtyCRM Pro

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
