'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard, Kanban, Building2, Calendar as CalendarIcon, PieChart as PieChartIcon,
  Settings, LogOut, Search, Bell, Plus, Menu, Users, DollarSign, TrendingUp, Home,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Phone, Mail, MessageSquare, MapPin,
  Bed, Bath, Square, Eye, Edit2, ArrowRight, ChevronLeft, ChevronRight, Clock,
  Activity, Filter, Download, MoreVertical
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ViewState, Lead, LeadStatus } from '@/types/crm';
import {
  MOCK_PROPERTIES, MOCK_LEADS, MOCK_SHOWINGS,
  CHART_DATA, LEAD_SOURCE_DATA, REVENUE_FORECAST_DATA
} from '@/data/mockData';

// --- COMPONENTS ---

const Sidebar: React.FC<{ currentView: ViewState; setView: (view: ViewState) => void }> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PIPELINE', label: 'Pipeline', icon: Kanban },
    { id: 'PROPERTIES', label: 'Listings', icon: Building2 },
    { id: 'CALENDAR', label: 'Calendar', icon: CalendarIcon },
    { id: 'REPORTS', label: 'Reports', icon: PieChartIcon },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-10 hidden md:flex">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">R</div>
        <span className="text-xl font-bold tracking-tight">RealtyCRM Pro</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
          <Settings size={20} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors mt-1">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const TopBar: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 md:hidden">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
        </button>
        <span className="font-bold text-slate-800">RealtyCRM</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search leads, properties, or addresses..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-600/20">
          <Plus size={16} />
          New Lead
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-sm font-semibold text-slate-900">Marcus Doe</span>
            <span className="text-xs text-slate-500">Senior Broker</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
            <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <button className="text-slate-400 hover:text-slate-600">
        <MoreHorizontal size={18} />
      </button>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-500 text-sm font-medium mb-1">{title}</span>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <div className="flex items-center mt-2 gap-2">
        <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
          trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
          {change}
        </span>
        <span className="text-slate-400 text-xs">vs last month</span>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, Marcus. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            Last updated: Just now
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value="128" change="+12.5%" trend="up" icon={Users} color="bg-blue-500" />
        <StatCard title="Pipeline Value" value="$2.4M" change="+8.2%" trend="up" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Active Listings" value="15" change="-2.1%" trend="down" icon={Home} color="bg-purple-500" />
        <StatCard title="Conversion Rate" value="3.2%" change="+1.4%" trend="up" icon={TrendingUp} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Lead Generation Trend</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1 bg-slate-50 text-slate-600 focus:outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#1e293b', fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-6">
             {MOCK_LEADS.slice(0, 5).map((lead, idx) => (
               <div key={idx} className="flex gap-4">
                 <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                   lead.aiScore > 80 ? 'bg-emerald-500' : lead.aiScore > 50 ? 'bg-amber-500' : 'bg-slate-300'
                 }`}></div>
                 <div>
                   <p className="text-sm text-slate-800">
                     <span className="font-semibold">{lead.firstName} {lead.lastName}</span> {lead.lastActivity}
                   </p>
                   <span className="text-xs text-slate-400 block mt-1">{lead.createdAt}</span>
                 </div>
               </div>
             ))}
          </div>
          <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            View Full Log
          </button>
        </div>
      </div>
    </div>
  );
};

const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const PIPELINE_COLUMNS = [
    { id: LeadStatus.NEW, title: 'New Leads', color: 'border-blue-500' },
    { id: LeadStatus.CONTACTED, title: 'Contacted', color: 'border-purple-500' },
    { id: LeadStatus.SHOWING, title: 'Showing Scheduled', color: 'border-amber-500' },
    { id: LeadStatus.OFFER, title: 'Offer Received', color: 'border-emerald-500' },
    { id: LeadStatus.CLOSED, title: 'Closed', color: 'border-slate-500' },
  ];

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: LeadStatus) => {
    if (draggedLead) {
      const updatedLeads = leads.map(l =>
        l.id === draggedLead.id ? { ...l, status } : l
      );
      setLeads(updatedLeads);
      setDraggedLead(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 ring-emerald-500/20';
    if (score >= 50) return 'text-amber-600 bg-amber-50 ring-amber-500/20';
    return 'text-slate-600 bg-slate-50 ring-slate-500/20';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Filter</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {PIPELINE_COLUMNS.map((column) => {
            const columnLeads = leads.filter(l => l.status === column.id);
            const totalValue = columnLeads.length * 450000;

            return (
              <div
                key={column.id}
                className="flex-1 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 h-full"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div className={`p-4 border-b-2 ${column.color} bg-white rounded-t-xl`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-slate-800">{column.title}</h3>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{columnLeads.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    ${(totalValue / 1000000).toFixed(1)}M Potential
                  </div>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-move hover:shadow-md transition-all hover:border-blue-300 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{lead.firstName} {lead.lastName}</h4>
                          <span className="text-xs text-slate-500">{lead.source}</span>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-xs px-2 py-1 rounded-full ring-1 ring-inset font-medium ${getScoreColor(lead.aiScore)}`}>
                          AI Score: {lead.aiScore}
                        </span>
                        {lead.status === LeadStatus.OFFER && (
                           <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                             $520k Offer
                           </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1">
                           <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold border border-white">
                             {lead.assignedAgent.charAt(0)}
                           </div>
                           <span className="text-xs text-slate-400 ml-1">2d ago</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Phone size={14}/></button>
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Mail size={14}/></button>
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><MessageSquare size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium hover:border-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> New Lead
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Properties: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1">Manage your active listings and view analytics.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-600/20">
          + Add Listing
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PROPERTIES.map((property) => (
          <div key={property.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all group">
            <div className="relative h-48 bg-slate-200">
              <img
                src={property.image}
                alt={property.address}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                  property.status === 'For Sale' ? 'bg-emerald-500 text-white' :
                  property.status === 'Under Contract' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {property.status}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">View Details</button>
                 <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30"><Edit2 size={18} /></button>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 truncate">{property.address}</h3>
              <div className="flex items-center text-slate-500 text-sm mb-4">
                <MapPin size={14} className="mr-1" />
                {property.city}, {property.state}
              </div>

              <div className="flex justify-between items-center py-4 border-t border-b border-slate-100 mb-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-slate-700 font-semibold">
                    <Bed size={16} className="mr-1.5 text-blue-500" /> {property.beds}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Beds</span>
                </div>
                <div className="w-[1px] h-8 bg-slate-100"></div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-slate-700 font-semibold">
                    <Bath size={16} className="mr-1.5 text-blue-500" /> {property.baths}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Baths</span>
                </div>
                <div className="w-[1px] h-8 bg-slate-100"></div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-slate-700 font-semibold">
                    <Square size={16} className="mr-1.5 text-blue-500" /> {property.sqft.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Sqft</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="text-2xl font-bold text-slate-900">
                  ${(property.price / 1000).toFixed(0)}k
                </div>
                <div className="flex gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1" title="Views">
                    <Eye size={14} /> {property.views}
                  </div>
                  <div className="flex items-center gap-1" title="Leads">
                    <Users size={14} /> {property.leads}
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-100 group-hover:border-slate-200">
                Manage Listing <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Calendar: React.FC = () => {
  const monthName = 'October 2023';
  const startDay = 0;
  const daysInMonth = 31;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getShowingsForDay = (day: number) => {
    return MOCK_SHOWINGS.filter(s => s.date === day);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 mt-1">Manage showings and appointments.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-600/20 flex items-center gap-2">
          <Plus size={16} /> Schedule Showing
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4">Upcoming Showings</h3>
            <div className="space-y-4">
              {MOCK_SHOWINGS.sort((a, b) => a.date - b.date).map((showing) => (
                <div key={showing.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Oct {showing.date}
                    </span>
                    <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{showing.leadName}</h4>
                  <div className="flex items-center text-slate-500 text-xs gap-3">
                    <span className="flex items-center gap-1"><Clock size={12}/> {showing.time}</span>
                    <span className="flex items-center gap-1 truncate max-w-[120px]" title={showing.address}><MapPin size={12}/> {showing.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">{monthName}</h2>
            <div className="flex items-center gap-2">
               <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={20}/></button>
               <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={20}/></button>
               <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-slate-900">Month</button>
                 <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900">Week</button>
                 <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900">Day</button>
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200">
              {DAYS.map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {calendarDays.map((day, idx) => {
                const showings = day ? getShowingsForDay(day) : [];
                return (
                  <div key={idx} className={`min-h-[100px] border-b border-r border-slate-100 p-2 relative group ${!day ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}`}>
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${day === 5 ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                          {day}
                        </span>

                        <div className="mt-1 space-y-1">
                          {showings.map((s) => (
                            <div key={s.id} className={`text-[10px] px-1.5 py-1 rounded truncate border-l-2 cursor-pointer transition-all hover:scale-[1.02] ${
                              s.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' :
                              s.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-500' :
                              'bg-slate-100 text-slate-600 border-slate-400'
                            }`}>
                              {s.time} - {s.leadName}
                            </div>
                          ))}
                        </div>

                        <button className="absolute bottom-2 right-2 p-1 text-blue-600 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded transition-all">
                          <Plus size={14} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReportStatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
}

const ReportStatCard: React.FC<ReportStatCardProps> = ({ label, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="text-xs text-slate-400">{subtext}</p>
  </div>
);

const Reports: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Track performance, lead sources, and revenue.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Filter size={16} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-600/20">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportStatCard label="Total Revenue" value="$2.4M" subtext="+12% from last month" icon={DollarSign} color="bg-emerald-500" />
        <ReportStatCard label="Active Leads" value="127" subtext="24 new this week" icon={Users} color="bg-blue-500" />
        <ReportStatCard label="Conversion Rate" value="3.8%" subtext="Top 10% of market" icon={Activity} color="bg-purple-500" />
        <ReportStatCard label="Avg. Time to Close" value="42 Days" subtext="-5 days improvement" icon={TrendingUp} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Revenue Forecast</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="projected" name="Projected" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Lead Source Breakdown</h3>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={LEAD_SOURCE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {LEAD_SOURCE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{right: 0}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-[110px] md:pr-[120px] lg:pr-[100px]">
              <span className="block text-3xl font-bold text-slate-900">1,200</span>
              <span className="text-xs text-slate-500 font-medium">Total Leads</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
           <h3 className="font-bold text-slate-900">Top Performing Listings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Views</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Showings</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">8802 Lakeview Dr</td>
                <td className="px-6 py-4">3,500</td>
                <td className="px-6 py-4">42</td>
                <td className="px-6 py-4">12</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Under Contract</span></td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">123 Highland Ave</td>
                <td className="px-6 py-4">1,240</td>
                <td className="px-6 py-4">15</td>
                <td className="px-6 py-4">5</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">For Sale</span></td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">405 Industrial Lofts</td>
                <td className="px-6 py-4">890</td>
                <td className="px-6 py-4">8</td>
                <td className="px-6 py-4">2</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">For Sale</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const CRMApp: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('DASHBOARD');

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'PIPELINE':
        return <Pipeline />;
      case 'PROPERTIES':
        return <Properties />;
      case 'CALENDAR':
        return <Calendar />;
      case 'REPORTS':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} setView={setView} />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <TopBar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CRMApp;
