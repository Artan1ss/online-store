import React from 'react';
import Navbar from './Navbar';
import CartNotification from './CartNotification';

interface NoFooterLayoutProps {
  children: React.ReactNode;
}

export default function NoFooterLayout({ children }: NoFooterLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <CartNotification />
      <main className="flex-grow pt-16 pb-8">
        {children}
      </main>
      {/* No footer here */}
    </div>
  );
} 