'use client';

import React, { useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Eye,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
} from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

// Mock analytics data
const kpis = [
  {
    label: 'Total Leads',
    value: 127,
    change: 18,
    changePercent: 16.5,
    trend: 'up' as const,
    icon: Users,
  },
  {
    label: 'New Listings',
    value: 5,
    change: 2,
    changePercent: 66.7,
    trend: 'up' as const,
    icon: Building2,
  },
  {
    label: 'Showings',
    value: 23,
    change: 5,
    changePercent: 27.8,
    trend: 'up' as const,
    icon: Eye,
  },
  {
    label: 'Conversion Rate',
    value: '35%',
    change: -2,
    changePercent: -5.4,
    trend: 'down' as const,
    icon: Target,
  },
  {
    label: 'Pipeline Value',
    value: formatCurrency(2450000),
    change: 320000,
    changePercent: 15.0,
    trend: 'up' as const,
    icon: DollarSign,
  },
  {
    label: 'Closed Deals',
    value: 3,
    change: 1,
    changePercent: 50.0,
    trend: 'up' as const,
    icon: TrendingUp,
  },
];

const leadsBySource = [
  { source: 'Website', count: 52, percentage: 41 },
  { source: 'Facebook Ads', count: 38, percentage: 30 },
  { source: 'Referral', count: 25, percentage: 20 },
  { source: 'Other', count: 12, percentage: 9 },
];

const pipelineData = [
  { stage: 'New Leads', count: 45, value: 580000 },
  { stage: 'Contacted', count: 38, value: 720000 },
  { stage: 'Showing Scheduled', count: 22, value: 890000 },
  { stage: 'Offer Received', count: 8, value: 420000 },
  { stage: 'Closed', count: 14, value: 840000 },
];

const propertyPerformance = [
  {
    address: '123 Main St',
    price: 650000,
    leads: 28,
    showings: 8,
    daysOnMarket: 12,
    status: 'for_sale',
  },
  {
    address: '456 Oak Ave',
    price: 520000,
    leads: 35,
    showings: 12,
    daysOnMarket: 28,
    status: 'under_contract',
  },
  {
    address: '789 Elm Dr',
    price: 425000,
    leads: 22,
    showings: 6,
    daysOnMarket: 5,
    status: 'for_sale',
  },
  {
    address: '321 Pine Rd',
    price: 875000,
    leads: 18,
    showings: 4,
    daysOnMarket: 3,
    status: 'for_sale',
  },
  {
    address: '555 Cedar Ln',
    price: 340000,
    leads: 42,
    showings: 15,
    daysOnMarket: 45,
    status: 'closed',
  },
];

const monthlyTrends = [
  { month: 'Jun', leads: 45, showings: 12, closings: 2 },
  { month: 'Jul', leads: 52, showings: 15, closings: 1 },
  { month: 'Aug', leads: 68, showings: 18, closings: 3 },
  { month: 'Sep', leads: 75, showings: 22, closings: 2 },
  { month: 'Oct', leads: 98, showings: 28, closings: 4 },
  { month: 'Nov', leads: 127, showings: 35, closings: 3 },
];

const dateRangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
];

// Simple bar chart component
const BarChartSimple: React.FC<{ data: typeof monthlyTrends }> = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.leads));
  return (
    <div className="flex items-end justify-between h-48 gap-4">
      {data.map((item) => (
        <div key={item.month} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center gap-1 mb-2">
            <div
              className="w-full bg-primary-200 rounded-t"
              style={{ height: `${(item.leads / maxValue) * 150}px` }}
            />
            <div
              className="w-full bg-success-400 rounded-t -mt-1"
              style={{ height: `${(item.showings / maxValue) * 150}px` }}
            />
          </div>
          <span className="text-xs text-neutral-500">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

// Pie chart component
const PieChartSimple: React.FC<{ data: typeof leadsBySource }> = ({ data }) => {
  const colors = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-neutral-400'];
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((item, index) => {
            const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += item.percentage;

            const colorMap: Record<number, string> = {
              0: '#2563eb',
              1: '#10b981',
              2: '#f97316',
              3: '#9ca3af',
            };

            return (
              <circle
                key={item.source}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={colorMap[index]}
                strokeWidth="3.5"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900">127</p>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.source} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', colors[index])} />
            <span className="text-sm text-neutral-600">{item.source}</span>
            <span className="text-sm font-medium text-neutral-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
          <p className="text-neutral-500">Track your performance and business metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-neutral-600" />
                </div>
                <div
                  className={cn(
                    'flex items-center text-xs font-medium',
                    kpi.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(kpi.changePercent)}%
                </div>
              </div>
              <p className="text-xl font-bold text-neutral-900">{kpi.value}</p>
              <p className="text-xs text-neutral-500">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lead & Showing Trends</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary-200" />
                <span className="text-neutral-600">Leads</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-success-400" />
                <span className="text-neutral-600">Showings</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={monthlyTrends} />
          </CardContent>
        </Card>

        {/* Lead Sources Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartSimple data={leadsBySource} />
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pipeline Analysis</CardTitle>
          <Badge variant="success">
            Total Value: {formatCurrency(pipelineData.reduce((sum, d) => sum + d.value, 0))}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineData.map((stage, index) => {
              const maxCount = Math.max(...pipelineData.map((d) => d.count));
              const widthPercent = (stage.count / maxCount) * 100;
              const colors = [
                'bg-blue-500',
                'bg-yellow-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-green-500',
              ];

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', colors[index])} />
                      <span className="text-sm font-medium text-neutral-700">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-neutral-500">{stage.count} leads</span>
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[index])}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Property Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Property Performance</CardTitle>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Showings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Days on Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {propertyPerformance.map((property) => (
                  <tr key={property.address} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      {property.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {formatCurrency(property.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{property.leads}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{property.showings}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {property.daysOnMarket}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          property.status === 'closed'
                            ? 'success'
                            : property.status === 'under_contract'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {property.status === 'for_sale'
                          ? 'For Sale'
                          : property.status === 'under_contract'
                          ? 'Under Contract'
                          : 'Closed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-full max-w-xl space-y-2">
              {[
                { label: 'Website Visitors', count: 2450, width: '100%', color: 'bg-neutral-200' },
                { label: 'Lead Form Submissions', count: 127, width: '80%', color: 'bg-primary-200' },
                { label: 'Showings Scheduled', count: 45, width: '60%', color: 'bg-primary-400' },
                { label: 'Offers Made', count: 12, width: '40%', color: 'bg-primary-500' },
                { label: 'Deals Closed', count: 3, width: '20%', color: 'bg-success-500' },
              ].map((step, index) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="w-40 text-right">
                    <p className="text-sm font-medium text-neutral-700">{step.label}</p>
                    <p className="text-xs text-neutral-500">{step.count.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 h-8 bg-neutral-100 rounded-r-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-r-full transition-all', step.color)}
                      style={{ width: step.width }}
                    />
                  </div>
                  {index < 4 && (
                    <div className="w-16 text-right">
                      <span className="text-xs text-neutral-500">
                        {index === 0
                          ? '5.2%'
                          : index === 1
                          ? '35.4%'
                          : index === 2
                          ? '26.7%'
                          : '25.0%'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
