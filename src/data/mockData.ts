import { Lead, Property, Showing, LeadStatus, ChartDataPoint, LeadSourceDataPoint } from '@/types/crm';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '123 Highland Ave',
    city: 'Austin',
    state: 'TX',
    price: 650000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    status: 'For Sale',
    image: 'https://picsum.photos/seed/house1/400/300',
    views: 1240,
    leads: 15
  },
  {
    id: 'p2',
    address: '8802 Lakeview Dr',
    city: 'Austin',
    state: 'TX',
    price: 1250000,
    beds: 5,
    baths: 4.5,
    sqft: 4200,
    status: 'Under Contract',
    image: 'https://picsum.photos/seed/house2/400/300',
    views: 3500,
    leads: 42
  },
  {
    id: 'p3',
    address: '405 Industrial Lofts',
    city: 'Dallas',
    state: 'TX',
    price: 450000,
    beds: 2,
    baths: 2,
    sqft: 1100,
    status: 'For Sale',
    image: 'https://picsum.photos/seed/house3/400/300',
    views: 890,
    leads: 8
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.j@gmail.com',
    phone: '(512) 555-0123',
    source: 'Website',
    status: LeadStatus.NEW,
    aiScore: 85,
    createdAt: '2023-10-25',
    assignedAgent: 'Marcus Doe',
    lastActivity: 'Viewed 123 Highland Ave 2 hours ago'
  },
  {
    id: 'l2',
    firstName: 'Mike',
    lastName: 'Ross',
    email: 'mike.ross@law.com',
    phone: '(212) 555-9999',
    source: 'Referral',
    status: LeadStatus.SHOWING,
    aiScore: 92,
    createdAt: '2023-10-22',
    assignedAgent: 'Marcus Doe',
    lastActivity: 'Scheduled showing for tomorrow'
  },
  {
    id: 'l3',
    firstName: 'Elena',
    lastName: 'Gilbert',
    email: 'elena@mystic.com',
    phone: '(703) 555-1234',
    source: 'Ad',
    status: LeadStatus.CONTACTED,
    aiScore: 45,
    createdAt: '2023-10-24',
    assignedAgent: 'Jennifer Smith',
    lastActivity: 'Email opened 1 day ago'
  },
  {
    id: 'l4',
    firstName: 'Tom',
    lastName: 'Haverford',
    email: 'tom@entertainment720.com',
    phone: '(317) 555-7200',
    source: 'Zillow',
    status: LeadStatus.OFFER,
    aiScore: 98,
    createdAt: '2023-10-15',
    assignedAgent: 'Marcus Doe',
    lastActivity: 'Submitted offer on Lakeview Dr'
  },
  {
    id: 'l5',
    firstName: 'Leslie',
    lastName: 'Knope',
    email: 'leslie@pawnee.gov',
    phone: '(317) 555-0001',
    source: 'Website',
    status: LeadStatus.NEW,
    aiScore: 60,
    createdAt: '2023-10-26',
    assignedAgent: 'Jennifer Smith',
    lastActivity: 'Signed up via landing page'
  }
];

export const MOCK_SHOWINGS: Showing[] = [
  {
    id: 's1',
    propertyId: 'p1',
    leadName: 'Mike Ross',
    date: 5,
    time: '14:00',
    duration: 30,
    status: 'Confirmed',
    address: '123 Highland Ave'
  },
  {
    id: 's2',
    propertyId: 'p2',
    leadName: 'Sarah Jenkins',
    date: 5,
    time: '16:30',
    duration: 45,
    status: 'Pending',
    address: '8802 Lakeview Dr'
  },
  {
    id: 's3',
    propertyId: 'p3',
    leadName: 'Tom Haverford',
    date: 8,
    time: '10:00',
    duration: 30,
    status: 'Confirmed',
    address: '405 Industrial Lofts'
  },
  {
    id: 's4',
    propertyId: 'p1',
    leadName: 'Elena Gilbert',
    date: 12,
    time: '11:15',
    duration: 30,
    status: 'Completed',
    address: '123 Highland Ave'
  },
  {
    id: 's5',
    propertyId: 'p2',
    leadName: 'Leslie Knope',
    date: 24,
    time: '09:00',
    duration: 60,
    status: 'Confirmed',
    address: '8802 Lakeview Dr'
  }
];

export const CHART_DATA: ChartDataPoint[] = [
  { name: 'Mon', leads: 4, visitors: 240 },
  { name: 'Tue', leads: 7, visitors: 300 },
  { name: 'Wed', leads: 5, visitors: 280 },
  { name: 'Thu', leads: 12, visitors: 450 },
  { name: 'Fri', leads: 9, visitors: 390 },
  { name: 'Sat', leads: 15, visitors: 560 },
  { name: 'Sun', leads: 8, visitors: 320 },
];

export const LEAD_SOURCE_DATA: LeadSourceDataPoint[] = [
  { name: 'Website', value: 400, color: '#2563EB' },
  { name: 'Referral', value: 300, color: '#10B981' },
  { name: 'Zillow', value: 300, color: '#F59E0B' },
  { name: 'Ads', value: 200, color: '#6366F1' },
];

export const REVENUE_FORECAST_DATA: ChartDataPoint[] = [
  { name: 'Oct', revenue: 65000, projected: 70000 },
  { name: 'Nov', revenue: 59000, projected: 75000 },
  { name: 'Dec', revenue: 80000, projected: 85000 },
  { name: 'Jan', revenue: 45000, projected: 90000 },
  { name: 'Feb', revenue: 0, projected: 95000 },
];
