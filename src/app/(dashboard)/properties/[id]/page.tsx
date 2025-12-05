'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Users,
  Eye,
  DollarSign,
  Clock,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  Modal,
  ModalFooter,
} from '@/components/ui';
import { formatCurrency, formatDate, getPropertyStatusBadge, cn } from '@/lib/utils';

// Mock property data
const property = {
  id: '1',
  address: '123 Main Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78704',
  price: 650000,
  bedrooms: 5,
  bathrooms: 3,
  sqft: 2500,
  status: 'for_sale',
  description:
    'Beautiful Austin home in the heart of South Congress. This stunning property features an open floor plan, modern kitchen with stainless steel appliances, hardwood floors throughout, and a spacious backyard perfect for entertaining. Located minutes from downtown Austin, this home offers the perfect blend of urban convenience and suburban comfort.',
  mlsNumber: 'MLS1234567',
  yearBuilt: 2018,
  lotSize: '0.25 acres',
  propertyType: 'Single Family',
  listingDate: new Date('2025-11-23'),
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  ],
  features: [
    'Hardwood Floors',
    'Stainless Steel Appliances',
    'Central A/C',
    'Attached Garage',
    'Fenced Yard',
    'Updated Kitchen',
    'Smart Home Features',
    'Solar Panels',
  ],
};

const leads = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '(512) 555-1234',
    score: 92,
    status: 'showing_scheduled',
    lastActivity: 'Showing scheduled for Dec 6',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '(512) 555-5678',
    score: 78,
    status: 'contacted',
    lastActivity: 'Email opened 2h ago',
  },
  {
    id: '3',
    name: 'Mike Thompson',
    email: 'mike@example.com',
    phone: '(512) 555-9012',
    score: 65,
    status: 'new',
    lastActivity: 'Form submitted yesterday',
  },
];

const showings = [
  {
    id: '1',
    date: new Date('2025-12-06T14:00:00'),
    lead: 'John Smith',
    status: 'scheduled',
    feedback: null,
  },
  {
    id: '2',
    date: new Date('2025-12-03T10:00:00'),
    lead: 'Emily Davis',
    status: 'completed',
    feedback: 'Loved the kitchen, concerned about backyard size',
  },
  {
    id: '3',
    date: new Date('2025-12-01T16:30:00'),
    lead: 'Robert Wilson',
    status: 'completed',
    feedback: 'Too far from downtown',
  },
];

const documents = [
  { id: '1', name: 'Seller Disclosure', type: 'disclosure', date: new Date('2025-11-23') },
  { id: '2', name: 'Property Survey', type: 'survey', date: new Date('2025-11-20') },
  { id: '3', name: 'HOA Documents', type: 'hoa', date: new Date('2025-11-18') },
];

export default function PropertyDetailPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusBadge = getPropertyStatusBadge(property.status);
  const daysOnMarket = Math.floor(
    (Date.now() - property.listingDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/properties"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
            Share
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="relative h-[400px] bg-neutral-100">
              <img
                src={property.images[currentImageIndex]}
                alt={property.address}
                className="w-full h-full object-cover"
              />
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
              <div className="absolute top-4 left-4">
                <Badge className={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
            </div>
            <div className="p-4 flex gap-2 overflow-x-auto">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                    index === currentImageIndex
                      ? 'border-primary-500'
                      : 'border-transparent'
                  )}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Card>

          {/* Property Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-neutral-900">
                    {formatCurrency(property.price)}
                  </p>
                  <div className="flex items-center gap-1 text-neutral-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <p>
                      {property.address}, {property.city}, {property.state}{' '}
                      {property.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-neutral-100">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-neutral-400" />
                  <span className="font-medium">{property.bedrooms}</span>
                  <span className="text-neutral-500">beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-neutral-400" />
                  <span className="font-medium">{property.bathrooms}</span>
                  <span className="text-neutral-500">baths</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5 text-neutral-400" />
                  <span className="font-medium">{property.sqft.toLocaleString()}</span>
                  <span className="text-neutral-500">sqft</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-neutral-900 mb-2">Description</h3>
                <p className="text-neutral-600">{property.description}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-neutral-900 mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature) => (
                    <Badge key={feature} variant="neutral">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">MLS #</p>
                  <p className="font-medium">{property.mlsNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Year Built</p>
                  <p className="font-medium">{property.yearBuilt}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Lot Size</p>
                  <p className="font-medium">{property.lotSize}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Property Type</p>
                  <p className="font-medium">{property.propertyType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Showings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Showings</CardTitle>
              <Button size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
                Schedule
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                {showings.map((showing) => (
                  <div key={showing.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            showing.status === 'scheduled'
                              ? 'bg-primary-50'
                              : 'bg-neutral-100'
                          )}
                        >
                          <Calendar
                            className={cn(
                              'w-5 h-5',
                              showing.status === 'scheduled'
                                ? 'text-primary-600'
                                : 'text-neutral-400'
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{showing.lead}</p>
                          <p className="text-sm text-neutral-500">
                            {formatDate(showing.date)} at{' '}
                            {showing.date.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={showing.status === 'scheduled' ? 'primary' : 'neutral'}
                      >
                        {showing.status === 'scheduled' ? 'Upcoming' : 'Completed'}
                      </Badge>
                    </div>
                    {showing.feedback && (
                      <p className="text-sm text-neutral-600 ml-13 pl-10">
                        Feedback: {showing.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto text-neutral-400" />
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {daysOnMarket}
                  </p>
                  <p className="text-xs text-neutral-500">Days on Market</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <Users className="w-5 h-5 mx-auto text-neutral-400" />
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {leads.length}
                  </p>
                  <p className="text-xs text-neutral-500">Total Leads</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <Eye className="w-5 h-5 mx-auto text-neutral-400" />
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {showings.length}
                  </p>
                  <p className="text-xs text-neutral-500">Showings</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto text-neutral-400" />
                  <p className="text-2xl font-bold text-neutral-900 mt-1">0</p>
                  <p className="text-xs text-neutral-500">Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interested Leads</CardTitle>
              <Link
                href="/leads"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="px-6 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <div>
                          <p className="font-medium text-neutral-900">{lead.name}</p>
                          <p className="text-xs text-neutral-500">{lead.lastActivity}</p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          lead.score >= 90
                            ? 'bg-success-100 text-success-700'
                            : lead.score >= 70
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-700'
                        )}
                      >
                        {lead.score}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ml-11">
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-1.5 rounded-lg hover:bg-neutral-100"
                      >
                        <Mail className="w-4 h-4 text-neutral-400" />
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1.5 rounded-lg hover:bg-neutral-100"
                      >
                        <Phone className="w-4 h-4 text-neutral-400" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button size="sm" variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
                Upload
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{doc.name}</p>
                        <p className="text-xs text-neutral-500">{formatDate(doc.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action cannot be undone."
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger">Delete Property</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
