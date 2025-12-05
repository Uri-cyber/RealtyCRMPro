import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RealtyCRM Pro - Real Estate Seller CRM',
  description: 'An AI-powered CRM platform designed specifically for real estate sellers and listing agents to manage properties, leads, pipeline, and communications.',
  keywords: ['real estate', 'CRM', 'property management', 'lead management', 'real estate agents'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
