'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  Bell,
  CreditCard,
  Shield,
  Building2,
  ChevronRight,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Avatar,
} from '@/components/ui';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  profileImageUrl: string | null;
  licenseNumber: string | null;
  bio: string | null;
  timezone: string;
  tenant: {
    id: string;
    name: string;
    subscriptionTier: string;
  };
}

const settingsLinks = [
  {
    name: 'Team Management',
    description: 'Invite team members and manage roles',
    href: '/settings/team',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Organization',
    description: 'Update your organization details',
    href: '/settings/organization',
    icon: Building2,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Notifications',
    description: 'Configure email and SMS notifications',
    href: '/settings/notifications',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    name: 'Billing',
    description: 'Manage subscription and payment methods',
    href: '/settings/billing',
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
  },
  {
    name: 'Security',
    description: 'Password and two-factor authentication',
    href: '/settings/security',
    icon: Shield,
    color: 'bg-red-100 text-red-600',
  },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    licenseNumber: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          licenseNumber: data.user.licenseNumber || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
        alert('Profile updated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-500">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-neutral-500" />
                <h2 className="font-semibold text-neutral-900">Profile Information</h2>
              </div>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar
                    name={profile ? `${profile.firstName} ${profile.lastName}` : ''}
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-sm text-neutral-500">{profile?.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {profile?.role} at {profile?.tenant.name}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(512) 555-1234"
                />

                <Input
                  label="License Number"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="Your real estate license number"
                />

                <Textarea
                  label="Bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell clients about yourself..."
                  rows={3}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Quick Links</h3>
          <div className="space-y-2">
            {settingsLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}
                      >
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{link.name}</p>
                        <p className="text-xs text-neutral-500">{link.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
