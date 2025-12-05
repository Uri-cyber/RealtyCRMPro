'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Button } from '@/components/ui';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface DashboardData {
  stats: {
    activeListings: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    leadChange: string;
    showingsThisMonth: number;
    closedDeals: number;
    pipelineValue: number;
    conversionRate: string;
  };
  topLeads: Array<{
    id: string;
    name: string;
    email: string;
    score: number | null;
    property: string | null;
    status: string;
  }>;
  todaysShowings: Array<{
    id: string;
    time: string;
    property: string;
    lead: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    user: string;
    createdAt: string;
    details: Record<string, unknown> | null;
  }>;
}

// Fallback mock data for when API is not available
const fallbackStats = {
  activeListings: 0,
  totalLeads: 0,
  newLeadsThisMonth: 0,
  leadChange: '0',
  showingsThisMonth: 0,
  closedDeals: 0,
  pipelineValue: 0,
  conversionRate: '0',
};

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/analytics/dashboard');
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view dashboard data');
          } else {
            throw new Error('Failed to fetch dashboard data');
          }
          return;
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Unable to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = data?.stats || fallbackStats;
  const topLeads = data?.topLeads || [];
  const todaysShowings = data?.todaysShowings || [];
  const recentActivity = data?.recentActivity || [];

  const statsConfig = [
    {
      label: 'Active Listings',
      value: stats.activeListings,
      change: `+${stats.activeListings}`,
      changeType: 'positive' as const,
      icon: Building2,
      href: '/properties',
    },
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      change: parseFloat(stats.leadChange) >= 0 ? `+${stats.newLeadsThisMonth}` : `${stats.newLeadsThisMonth}`,
      changeType: parseFloat(stats.leadChange) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Users,
      href: '/leads',
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: `${parseFloat(stats.conversionRate) >= 0 ? '+' : ''}${stats.conversionRate}%`,
      changeType: parseFloat(stats.conversionRate) >= 0 ? 'positive' as const : 'negative' as const,
      icon: TrendingUp,
      href: '/reports',
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(stats.pipelineValue),
      change: stats.pipelineValue > 0 ? '+' : '',
      changeType: stats.pipelineValue > 0 ? 'positive' as const : 'negative' as const,
      icon: DollarSign,
      href: '/reports',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-warning-500" />
          <div>
            <p className="text-neutral-900 font-medium">{error}</p>
            <p className="text-sm text-neutral-500 mt-1">
              Dashboard will show real data once connected to the database.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
        {statsConfig.map((stat) => (
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
        {/* Today's Showings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Showings</CardTitle>
            <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {todaysShowings.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">No showings scheduled for today</p>
                </div>
              ) : (
                todaysShowings.map((showing) => (
                  <div key={showing.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-50">
                          <Calendar className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">Showing at {showing.property}</p>
                          <p className="text-xs text-neutral-500">with {showing.lead}</p>
                        </div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(showing.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lead Trend (30 days)</CardTitle>
            <Badge variant="success">+{stats.newLeadsThisMonth} this month</Badge>
          </CardHeader>
          <CardContent>
            <LeadTrendChart />
            <div className="flex justify-between mt-4 text-xs text-neutral-500">
              <span>30 days ago</span>
              <span>15 days ago</span>
              <span>Today</span>
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
              {topLeads.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">No leads yet</p>
                </div>
              ) : (
                topLeads.map((lead) => (
                  <div key={lead.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                          <p className="text-xs text-neutral-500">{lead.property || 'No property'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            (lead.score ?? 0) >= 90
                              ? 'bg-success-100 text-success-700'
                              : (lead.score ?? 0) >= 70
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {lead.score ?? '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
            {recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-neutral-500">
                <Eye className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">{activity.action}</span>
                          {activity.user && (
                            <>
                              {' '}
                              by <span className="text-primary-600">{activity.user}</span>
                            </>
                          )}
                        </p>
                        {activity.entityType && (
                          <p className="text-xs text-neutral-500">{activity.entityType}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {formatRelativeTime(new Date(activity.createdAt))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
