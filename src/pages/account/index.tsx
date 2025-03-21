import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FiUser, FiShoppingBag, FiSettings, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';

// Define order interface
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If user is logged in, redirect to profile page
    if (status === 'authenticated') {
      router.push('/account/profile');
    }
    // If user is not logged in, redirect to login page
    else if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/profile');
    }

    // Get order history
    if (session?.user?.email) {
      fetchOrderHistory();
    }
  }, [status, session, router]);

  const fetchOrderHistory = async () => {
    try {
      const response = await fetch('/api/orders/user');
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data);
      }
    } catch (error) {
      console.error('Failed to get order history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Redirection already set in useEffect
  }

  // Order status mapping
  const statusMap: { [key: string]: string } = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  };

  return (
    <>
      <Head>
        <title>My Account | NAMarket</title>
        <meta name="description" content="Manage your account information and order history" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="text-blue-600 text-2xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-lg">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link
                href="/account"
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md"
              >
                Account Overview
              </Link>
              <Link
                href="/account/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Profile
              </Link>
              <Link
                href="/account/addresses"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Addresses
              </Link>
              <Link
                href="/account/payment"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Payment Methods
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                My Orders
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-left rounded-md text-red-600 hover:bg-red-50"
              >
                <FiLogOut className="mr-3" /> Sign Out
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="bg-gray-50 p-3 rounded-md">{session?.user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="bg-gray-50 p-3 rounded-md">{session?.user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : orderHistory.length > 0 ? (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-gray-900">Order #{order.orderNumber || order.id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-CA')}
                          </p>
                        </div>
                        <p className="text-gray-700 mb-2">
                          Status: <span className="font-medium">{statusMap[order.status] || order.status}</span>
                        </p>
                        <p className="text-gray-700">
                          Total Amount: <span className="font-medium">${(order.totalAmount || 0).toFixed(2)}</span>
                        </p>
                        <Link href={`/order-details/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">You don't have any orders yet</p>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                <p className="text-gray-500 italic">Account settings coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 