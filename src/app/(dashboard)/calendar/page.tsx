'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Calendar as CalendarIcon,
  MoreVertical,
  Check,
  X,
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
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';

// Mock showings data
const showings = [
  {
    id: '1',
    date: new Date(2025, 11, 5, 14, 0),
    property: '123 Main St',
    propertyAddress: '123 Main Street, Austin, TX 78704',
    lead: 'John Smith',
    leadEmail: 'john@example.com',
    leadPhone: '(512) 555-1234',
    duration: 30,
    status: 'confirmed',
    notes: 'First-time buyer, interested in kitchen layout',
  },
  {
    id: '2',
    date: new Date(2025, 11, 5, 16, 30),
    property: '456 Oak Ave',
    propertyAddress: '456 Oak Avenue, Austin, TX 78701',
    lead: 'Sarah Johnson',
    leadEmail: 'sarah@example.com',
    leadPhone: '(512) 555-5678',
    duration: 45,
    status: 'pending',
    notes: '',
  },
  {
    id: '3',
    date: new Date(2025, 11, 6, 10, 0),
    property: '789 Elm Dr',
    propertyAddress: '789 Elm Drive, Austin, TX 78745',
    lead: 'Mike Thompson',
    leadEmail: 'mike@example.com',
    leadPhone: '(512) 555-9012',
    duration: 30,
    status: 'confirmed',
    notes: 'Second showing, bringing spouse',
  },
  {
    id: '4',
    date: new Date(2025, 11, 8, 11, 0),
    property: '321 Pine Rd',
    propertyAddress: '321 Pine Road, Austin, TX 78702',
    lead: 'Emily Davis',
    leadEmail: 'emily@example.com',
    leadPhone: '(512) 555-3456',
    duration: 30,
    status: 'confirmed',
    notes: '',
  },
  {
    id: '5',
    date: new Date(2025, 11, 10, 15, 0),
    property: '123 Main St',
    propertyAddress: '123 Main Street, Austin, TX 78704',
    lead: 'Robert Wilson',
    leadEmail: 'robert@example.com',
    leadPhone: '(512) 555-7890',
    duration: 30,
    status: 'pending',
    notes: 'Investor, looking for rental potential',
  },
];

const propertyOptions = [
  { value: '123-main', label: '123 Main St' },
  { value: '456-oak', label: '456 Oak Ave' },
  { value: '789-elm', label: '789 Elm Dr' },
  { value: '321-pine', label: '321 Pine Rd' },
];

const leadOptions = [
  { value: 'john', label: 'John Smith' },
  { value: 'sarah', label: 'Sarah Johnson' },
  { value: 'mike', label: 'Mike Thompson' },
  { value: 'emily', label: 'Emily Davis' },
  { value: 'robert', label: 'Robert Wilson' },
];

const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1));
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedShowing, setSelectedShowing] = useState<(typeof showings)[0] | null>(null);
  const [showNewShowingModal, setShowNewShowingModal] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getShowingsForDay = (day: number) => {
    return showings.filter((showing) => {
      return (
        showing.date.getFullYear() === currentDate.getFullYear() &&
        showing.date.getMonth() === currentDate.getMonth() &&
        showing.date.getDate() === day
      );
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2025, 11, 5)); // December 5, 2025 as "today"
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date(2025, 11, 5); // Mock "today"

  // Get today's showings for the sidebar
  const todaysShowings = showings.filter((showing) => {
    return (
      showing.date.getFullYear() === today.getFullYear() &&
      showing.date.getMonth() === today.getMonth() &&
      showing.date.getDate() === today.getDate()
    );
  });

  // Get upcoming showings (next 7 days)
  const upcomingShowings = showings
    .filter((showing) => {
      const daysDiff = Math.floor(
        (showing.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff > 0 && daysDiff <= 7;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
          <p className="text-neutral-500">Manage your showings and appointments</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewShowingModal(true)}
        >
          Schedule Showing
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-lg hover:bg-neutral-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg hover:bg-neutral-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">{monthName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('month')}
                    className={cn(
                      'px-3 py-1.5 text-sm',
                      viewMode === 'month'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-500 hover:bg-neutral-50'
                    )}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={cn(
                      'px-3 py-1.5 text-sm',
                      viewMode === 'week'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-500 hover:bg-neutral-50'
                    )}
                  >
                    Week
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-sm font-medium text-neutral-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const dayShowings = day ? getShowingsForDay(day) : [];
                  const isToday =
                    day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={index}
                      className={cn(
                        'min-h-[100px] p-1 border border-neutral-100 rounded-lg',
                        day ? 'bg-white' : 'bg-neutral-50',
                        isToday && 'bg-primary-50 border-primary-200'
                      )}
                    >
                      {day && (
                        <>
                          <div
                            className={cn(
                              'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                              isToday
                                ? 'bg-primary-600 text-white'
                                : 'text-neutral-700'
                            )}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayShowings.slice(0, 2).map((showing) => (
                              <button
                                key={showing.id}
                                onClick={() => setSelectedShowing(showing)}
                                className={cn(
                                  'w-full text-left px-1.5 py-0.5 text-xs rounded truncate',
                                  showing.status === 'confirmed'
                                    ? 'bg-success-100 text-success-700'
                                    : 'bg-warning-100 text-warning-700'
                                )}
                              >
                                {showing.date.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}{' '}
                                {showing.lead.split(' ')[0]}
                              </button>
                            ))}
                            {dayShowings.length > 2 && (
                              <p className="text-xs text-neutral-500 px-1">
                                +{dayShowings.length - 2} more
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todaysShowings.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {todaysShowings.map((showing) => (
                    <button
                      key={showing.id}
                      onClick={() => setSelectedShowing(showing)}
                      className="w-full px-6 py-4 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={
                            showing.status === 'confirmed' ? 'success' : 'warning'
                          }
                          size="sm"
                        >
                          {showing.status}
                        </Badge>
                        <span className="text-sm font-medium text-neutral-900">
                          {showing.date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900">
                        {showing.property}
                      </p>
                      <p className="text-xs text-neutral-500">with {showing.lead}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <CalendarIcon className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500">No showings today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingShowings.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {upcomingShowings.map((showing) => (
                    <button
                      key={showing.id}
                      onClick={() => setSelectedShowing(showing)}
                      className="w-full px-6 py-3 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <p className="text-xs text-neutral-500 mb-1">
                        {formatDate(showing.date)}
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {showing.property}
                      </p>
                      <p className="text-xs text-neutral-500">{showing.lead}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-neutral-500">No upcoming showings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Showing Detail Modal */}
      <Modal
        isOpen={!!selectedShowing}
        onClose={() => setSelectedShowing(null)}
        title="Showing Details"
        size="md"
      >
        {selectedShowing && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={selectedShowing.status === 'confirmed' ? 'success' : 'warning'}
                >
                  {selectedShowing.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>
              <button className="p-1 rounded hover:bg-neutral-100">
                <MoreVertical className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">
                    {formatDate(selectedShowing.date)} at{' '}
                    {selectedShowing.date.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Duration: {selectedShowing.duration} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">{selectedShowing.property}</p>
                  <p className="text-sm text-neutral-500">
                    {selectedShowing.propertyAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">{selectedShowing.lead}</p>
                  <p className="text-sm text-neutral-500">{selectedShowing.leadEmail}</p>
                  <p className="text-sm text-neutral-500">{selectedShowing.leadPhone}</p>
                </div>
              </div>

              {selectedShowing.notes && (
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Notes</p>
                  <p className="text-sm text-neutral-700">{selectedShowing.notes}</p>
                </div>
              )}
            </div>

            {selectedShowing.status === 'pending' && (
              <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                <Button className="flex-1" leftIcon={<Check className="w-4 h-4" />}>
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            )}

            <ModalFooter>
              <Button variant="outline" onClick={() => setSelectedShowing(null)}>
                Close
              </Button>
              <Button>Edit Showing</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* New Showing Modal */}
      <Modal
        isOpen={showNewShowingModal}
        onClose={() => setShowNewShowingModal(false)}
        title="Schedule New Showing"
      >
        <form className="space-y-4">
          <Select
            label="Property"
            placeholder="Select property"
            options={propertyOptions}
          />
          <Select label="Lead" placeholder="Select lead" options={leadOptions} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" />
            <Input label="Time" type="time" />
          </div>
          <Select
            label="Duration"
            placeholder="Select duration"
            options={durationOptions}
          />
          <Textarea label="Notes (optional)" placeholder="Add any notes for this showing..." rows={3} />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewShowingModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Showing</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
