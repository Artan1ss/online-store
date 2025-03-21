import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiHome, FiPackage, FiUsers, FiShoppingBag, FiSettings, FiLogOut } from 'react-icons/fi';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/auth/login');
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router]);
  
  // Show loading state while session is loading or unauthenticated
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Check if current route is active
  const isActive = (path: string) => {
    return router.pathname.startsWith(path) ? 'bg-blue-800 text-white' : 'text-gray-300 hover:bg-blue-700 hover:text-white';
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900">
        <div className="flex items-center justify-center h-16 bg-blue-950">
          <span className="text-white font-bold text-xl">NAMarket Admin</span>
        </div>
        <nav className="mt-5">
          <div className="px-2 space-y-1">
            <Link href="/admin/dashboard" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/dashboard')}`}>
              <FiHome className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link href="/admin/products" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/products')}`}>
              <FiPackage className="mr-3 h-5 w-5" />
              Products
            </Link>
            <Link href="/admin/orders" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/orders')}`}>
              <FiShoppingBag className="mr-3 h-5 w-5" />
              Orders
            </Link>
            <Link href="/admin/users" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/users')}`}>
              <FiUsers className="mr-3 h-5 w-5" />
              Users
            </Link>
            <Link href="/admin/settings" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/settings')}`}>
              <FiSettings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-0 w-64">
          <div className="px-2 py-4 bg-blue-950">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600">
                  <span className="text-sm font-medium leading-none text-white">
                    {session?.user?.name?.charAt(0) || 'A'}
                  </span>
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {session?.user?.name || 'Admin'}
                </p>
                <button
                  onClick={() => router.push('/api/auth/signout')}
                  className="text-xs font-medium text-gray-300 hover:text-white flex items-center mt-1"
                >
                  <FiLogOut className="mr-1 h-3 w-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 