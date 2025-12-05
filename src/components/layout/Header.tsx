'use client';

import React from 'react';
import { Bell, Menu, Search, Plus } from 'lucide-react';
import { Button, Avatar } from '@/components/ui';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onMenuClick,
  showSearch = true,
  actions,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          {title && (
            <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search leads, properties..."
                  className="pl-9 pr-4 py-2 w-64 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Custom actions */}
          {actions}

          {/* Quick add button */}
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Quick Add
          </Button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          {/* User avatar */}
          <Avatar
            name="John Doe"
            size="sm"
            status="online"
            className="cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
};

export { Header };
