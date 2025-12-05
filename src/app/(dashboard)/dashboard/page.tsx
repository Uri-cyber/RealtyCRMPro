'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Button } from '@/components/ui';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

// Mock data for dashboard
const stats = [
  {
    label: 'Active Listings',
    value: 5,
    change: '+2',
    changeType: 'positive' as const,
    icon: Building2,
    href: '/properties',
  },
  {
    label: 'Total Leads',
    value: 127,
    change: '+18',
    changeType: 'positive' as const,
    icon: Users,
    href: '/leads',
  },
  {
    label: 'Conversion Rate',
    value: '35%',
    change: '+5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    href: '/reports',
  },
  {
    label: 'Pipeline Value',
    value: formatCurrency(2450000),
    change: '-3%',
    changeType: 'negative' as const,
    icon: DollarSign,
    href: '/reports',
  },
];

const todaysTasks = [
  {
    id: '1',
    type: 'showing',
    title: 'Showing at 123 Main St',
    time: '2:00 PM',
    lead: 'John Smith',
  },
  {
    id: '2',
    type: 'showing',
    title: 'Showing at 456 Oak Ave',
    time: '4:30 PM',
    lead: 'Sarah Johnson',
  },
  {
    id: '3',
    type: 'followup',
    title: 'Follow up with Mike Thompson',
    time: 'Due today',
    lead: 'Mike Thompson',
  },
  {
    id: '4',
    type: 'offer',
    title: 'Review offer from Anna Lee',
    time: 'Urgent',
    lead: 'Anna Lee',
  },
];

const recentActivity = [
  {
    id: '1',
    action: 'New lead captured',
    subject: 'Emily Davis',
    property: '789 Elm Dr',
    time: new Date(Date.now() - 1000 * 60 * 30),
    icon: Users,
  },
  {
    id: '2',
    action: 'Showing completed',
    subject: 'John Smith',
    property: '123 Main St',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: Eye,
  },
  {
    id: '3',
    action: 'Message received',
    subject: 'Sarah Johnson',
    property: null,
    time: new Date(Date.now() - 1000 * 60 * 60 * 4),
    icon: MessageSquare,
  },
  {
    id: '4',
    action: 'Offer received',
    subject: 'Mike Thompson',
    property: '456 Oak Ave',
    time: new Date(Date.now() - 1000 * 60 * 60 * 8),
    icon: DollarSign,
  },
  {
    id: '5',
    action: 'Property listed',
    subject: null,
    property: '321 Pine Rd',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    icon: Building2,
  },
];

const topLeads = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    score: 92,
    property: '123 Main St',
    status: 'showing_scheduled',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    score: 85,
    property: '456 Oak Ave',
    status: 'contacted',
  },
  {
    id: '3',
    name: 'Mike Thompson',
    email: 'mike@example.com',
    score: 78,
    property: '789 Elm Dr',
    status: 'offer_received',
  },
];

// Simple chart component using CSS
const LeadTrendChart: React.FC = () => {
  const data = [40, 55, 45, 60, 75, 65, 80, 90, 85, 95, 100, 127];
  const max = Math.max(...data);

  return (
    <div className="flex items-end justify-between h-32 gap-1">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors cursor-pointer"
          style={{ height: `${(value / max) * 100}%` }}
          title={`${value} leads`}
        />
      ))}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
            Send Blast
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Priorities</CardTitle>
            <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {todaysTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          task.type === 'showing'
                            ? 'bg-primary-50'
                            : task.type === 'followup'
                            ? 'bg-warning-50'
                            : 'bg-success-50'
                        }`}
                      >
                        {task.type === 'showing' ? (
                          <Calendar className="w-4 h-4 text-primary-600" />
                        ) : task.type === 'followup' ? (
                          <Mail className="w-4 h-4 text-warning-600" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-success-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{task.title}</p>
                        <p className="text-xs text-neutral-500">with {task.lead}</p>
                      </div>
                    </div>
                    <Badge
                      variant={task.type === 'offer' ? 'danger' : 'neutral'}
                      size="sm"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {task.time}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lead Trend (30 days)</CardTitle>
            <Badge variant="success">+18 this month</Badge>
          </CardHeader>
          <CardContent>
            <LeadTrendChart />
            <div className="flex justify-between mt-4 text-xs text-neutral-500">
              <span>Nov 5</span>
              <span>Nov 20</span>
              <span>Dec 5</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Leads</CardTitle>
            <Link href="/leads" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {topLeads.map((lead) => (
                <div key={lead.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                        <p className="text-xs text-neutral-500">{lead.property}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          lead.score >= 90
                            ? 'bg-success-100 text-success-700'
                            : lead.score >= 70
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {lead.score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/reports" className="text-sm text-primary-600 hover:text-primary-700">
            View report
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <activity.icon className="w-4 h-4 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-900">
                        <span className="font-medium">{activity.action}</span>
                        {activity.subject && (
                          <>
                            {' '}
                            – <span className="text-primary-600">{activity.subject}</span>
                          </>
                        )}
                      </p>
                      {activity.property && (
                        <p className="text-xs text-neutral-500">{activity.property}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatRelativeTime(activity.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
