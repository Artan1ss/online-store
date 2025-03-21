import React from 'react';
import Navbar from './Navbar';
import CartNotification from './CartNotification';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <CartNotification />
      <main className="flex-grow pt-16 pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
} 