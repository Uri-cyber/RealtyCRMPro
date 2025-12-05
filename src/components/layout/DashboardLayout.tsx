'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  headerActions?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  showSearch = true,
  headerActions,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          showSearch={showSearch}
          actions={headerActions}
        />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export { DashboardLayout };
