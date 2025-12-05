'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Building2,
  GripVertical,
  X,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  Input,
  Select,
  Modal,
  ModalFooter,
  Textarea,
} from '@/components/ui';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

// Pipeline stages
const stages = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'showing_scheduled', label: 'Showing Scheduled', color: 'bg-purple-500' },
  { id: 'offer_received', label: 'Offer Received', color: 'bg-orange-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' },
];

// Mock leads data
const initialLeads = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(512) 555-1234',
    score: 92,
    stage: 'showing_scheduled',
    property: '123 Main St',
    source: 'Website',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(512) 555-5678',
    score: 85,
    stage: 'contacted',
    property: '456 Oak Ave',
    source: 'Facebook Ad',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Thompson',
    email: 'mike.t@email.com',
    phone: '(512) 555-9012',
    score: 78,
    stage: 'offer_received',
    property: '789 Elm Dr',
    source: 'Referral',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@email.com',
    phone: '(512) 555-3456',
    score: 65,
    stage: 'new',
    property: '123 Main St',
    source: 'Website',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    lastActivity: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'robert.w@email.com',
    phone: '(512) 555-7890',
    score: 55,
    stage: 'new',
    property: '321 Pine Rd',
    source: 'Website',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '6',
    firstName: 'Anna',
    lastName: 'Lee',
    email: 'anna.lee@email.com',
    phone: '(512) 555-2345',
    score: 88,
    stage: 'contacted',
    property: '456 Oak Ave',
    source: 'Facebook Ad',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.b@email.com',
    phone: '(512) 555-6789',
    score: 72,
    stage: 'closed',
    property: '555 Cedar Ln',
    source: 'Referral',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'lisa.m@email.com',
    phone: '(512) 555-0123',
    score: 45,
    stage: 'new',
    property: null,
    source: 'Website',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
];

const propertyOptions = [
  { value: '', label: 'All Properties' },
  { value: '123-main', label: '123 Main St' },
  { value: '456-oak', label: '456 Oak Ave' },
  { value: '789-elm', label: '789 Elm Dr' },
  { value: '321-pine', label: '321 Pine Rd' },
];

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook Ad' },
  { value: 'referral', label: 'Referral' },
  { value: 'import', label: 'Import' },
];

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  score: number;
  stage: string;
  property: string | null;
  source: string;
  createdAt: Date;
  lastActivity: Date;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = !propertyFilter || lead.property?.includes(propertyFilter);
    const matchesSource =
      !sourceFilter || lead.source.toLowerCase().includes(sourceFilter.toLowerCase());
    return matchesSearch && matchesProperty && matchesSource;
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter((lead) => lead.stage === stageId);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stage !== targetStage) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === draggedLead.id ? { ...lead, stage: targetStage } : lead
        )
      );
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Leads Pipeline</h1>
          <p className="text-neutral-500">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
            Import
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewLeadModal(true)}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search leads by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                options={propertyOptions}
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-40"
              />
              <Select
                options={sourceOptions}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                  <h3 className="font-semibold text-neutral-900">{stage.label}</h3>
                  <Badge variant="neutral" size="sm">
                    {stageLeads.length}
                  </Badge>
                </div>
                <button className="p-1 rounded hover:bg-neutral-100">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Column Content */}
              <div
                className={cn(
                  'kanban-column min-h-[500px] space-y-2',
                  draggedLead && draggedLead.stage !== stage.id && 'ring-2 ring-primary-300 ring-dashed'
                )}
              >
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedLead(lead)}
                    className={cn(
                      'kanban-card group',
                      draggedLead?.id === lead.id && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                        <Avatar
                          name={`${lead.firstName} ${lead.lastName}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">{lead.email}</p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          lead.score >= 80
                            ? 'bg-success-100 text-success-700'
                            : lead.score >= 60
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-700'
                        )}
                      >
                        {lead.score}
                      </div>
                    </div>

                    {lead.property && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
                        <Building2 className="w-3 h-3" />
                        {lead.property}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="text-xs text-neutral-400">
                        {formatRelativeTime(lead.lastActivity)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-neutral-100">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-neutral-100">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-neutral-100">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Lead Button */}
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors"
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Modal */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `${selectedLead.firstName} ${selectedLead.lastName}` : ''}
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar
                name={`${selectedLead.firstName} ${selectedLead.lastName}`}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h3>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      selectedLead.score >= 80
                        ? 'bg-success-100 text-success-700'
                        : selectedLead.score >= 60
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-700'
                    )}
                  >
                    {selectedLead.score}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <Mail className="w-4 h-4" />
                    {selectedLead.email}
                  </a>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <Phone className="w-4 h-4" />
                    {selectedLead.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">Status</p>
                <Badge
                  variant={
                    selectedLead.stage === 'closed'
                      ? 'success'
                      : selectedLead.stage === 'offer_received'
                      ? 'warning'
                      : 'primary'
                  }
                >
                  {stages.find((s) => s.id === selectedLead.stage)?.label}
                </Badge>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">Source</p>
                <p className="font-medium text-neutral-900">{selectedLead.source}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">Interested Property</p>
                <p className="font-medium text-neutral-900">
                  {selectedLead.property || 'Not specified'}
                </p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-1">Added</p>
                <p className="font-medium text-neutral-900">
                  {formatRelativeTime(selectedLead.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-neutral-900 mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" leftIcon={<Mail className="w-4 h-4" />}>
                  Send Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Phone className="w-4 h-4" />}
                >
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Calendar className="w-4 h-4" />}
                >
                  Schedule Showing
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-neutral-900 mb-2">Activity Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-900">Welcome email sent</p>
                    <p className="text-xs text-neutral-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-900">Lead created from website form</p>
                    <p className="text-xs text-neutral-500">
                      {formatRelativeTime(selectedLead.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
              <Button>Edit Lead</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* New Lead Modal */}
      <Modal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        title="Add New Lead"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="John" />
            <Input label="Last Name" placeholder="Smith" />
          </div>
          <Input label="Email" type="email" placeholder="john@example.com" />
          <Input label="Phone" placeholder="(512) 555-1234" />
          <Select
            label="Interested Property"
            placeholder="Select property"
            options={propertyOptions.slice(1)}
          />
          <Select
            label="Source"
            placeholder="How did they find you?"
            options={sourceOptions.slice(1)}
          />
          <Textarea label="Notes" placeholder="Add any additional notes..." rows={3} />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewLeadModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Lead</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
