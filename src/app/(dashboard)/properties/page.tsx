'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Building2,
  Bed,
  Bath,
  Square,
  MapPin,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Users,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Input, Select } from '@/components/ui';
import { formatCurrency, getPropertyStatusBadge, cn } from '@/lib/utils';

// Mock data
const properties = [
  {
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
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    daysOnMarket: 12,
    leads: 8,
    showings: 3,
  },
  {
    id: '2',
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    price: 520000,
    bedrooms: 4,
    bathrooms: 2,
    sqft: 1800,
    status: 'under_contract',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    daysOnMarket: 28,
    leads: 15,
    showings: 6,
  },
  {
    id: '3',
    address: '789 Elm Drive',
    city: 'Austin',
    state: 'TX',
    zipCode: '78745',
    price: 425000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    status: 'for_sale',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    daysOnMarket: 5,
    leads: 12,
    showings: 2,
  },
  {
    id: '4',
    address: '321 Pine Road',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    price: 875000,
    bedrooms: 6,
    bathrooms: 4,
    sqft: 3200,
    status: 'for_sale',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
    daysOnMarket: 3,
    leads: 4,
    showings: 1,
  },
  {
    id: '5',
    address: '555 Cedar Lane',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    price: 340000,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1100,
    status: 'closed',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop',
    daysOnMarket: 45,
    leads: 22,
    showings: 10,
  },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'for_sale', label: 'For Sale' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'leads', label: 'Most Leads' },
];

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Properties</h1>
          <p className="text-neutral-500">{properties.length} total listings</p>
        </div>
        <Link href="/properties/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Add Property</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by address or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-44"
              />
              <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const statusBadge = getPropertyStatusBadge(property.status);
            return (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card hover className="overflow-hidden h-full">
                  <div className="relative h-48 bg-neutral-100">
                    <img
                      src={property.image}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors">
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors">
                        <MoreVertical className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <p className="text-xl font-bold text-neutral-900">
                        {formatCurrency(property.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <p className="text-sm">
                        {property.address}, {property.city}, {property.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {property.bedrooms} beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.bathrooms} baths
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="w-4 h-4" />
                        {property.sqft.toLocaleString()} sqft
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-3 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {property.leads} leads
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {property.showings} showings
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {property.daysOnMarket} days on market
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-neutral-100">
            {filteredProperties.map((property) => {
              const statusBadge = getPropertyStatusBadge(property.status);
              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                      src={property.image}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {property.address}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {property.city}, {property.state} {property.zipCode}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                          <span>{property.bedrooms} beds</span>
                          <span>{property.bathrooms} baths</span>
                          <span>{property.sqft.toLocaleString()} sqft</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-neutral-900">
                          {formatCurrency(property.price)}
                        </p>
                        <Badge className={cn('mt-1', statusBadge.variant)}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {property.leads} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {property.showings} showings
                      </span>
                      <span>{property.daysOnMarket} days on market</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-neutral-300" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No properties found</h3>
            <p className="mt-2 text-neutral-500">
              {searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first property to get started'}
            </p>
            <Link href="/properties/new">
              <Button className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
