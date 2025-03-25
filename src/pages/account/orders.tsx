import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FiPackage, FiShoppingBag, FiClock, FiCheck, FiX, FiTruck, FiAlertCircle } from 'react-icons/fi';

const ORDER_STATUS = {
  PENDING: { label: 'Pending', icon: FiClock, color: 'text-yellow-500' },
  PROCESSING: { label: 'Processing', icon: FiPackage, color: 'text-blue-500' },
  SHIPPED: { label: 'Shipped', icon: FiTruck, color: 'text-purple-500' },
  DELIVERED: { label: 'Delivered', icon: FiCheck, color: 'text-green-500' },
  CANCELLED: { label: 'Cancelled', icon: FiX, color: 'text-red-500' }
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: keyof typeof ORDER_STATUS;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/orders');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  // Timer to clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Return empty cleanup function for the case when there's no successMessage
    return () => {};
  }, [successMessage]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch order list');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching order list:', error);
      setError('Unable to load orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsDeleting(true);
      setDeleteOrderId(orderId);
      setError('');
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
      }
      
      // Show success message
      setSuccessMessage('Order successfully deleted');
      
      // Refresh order list
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      setError(error.message || 'An error occurred while deleting the order. Please try again later');
    } finally {
      setIsDeleting(false);
      setDeleteOrderId(null);
    }
  };

  // Confirm delete dialog
  const confirmDeleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      handleDeleteOrder(orderId);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>My Orders | NAMarket</title>
        <meta name="description" content="View your order history and status" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FiShoppingBag className="text-blue-600 text-2xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-lg">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
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
                className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md"
              >
                My Orders
              </Link>
            </nav>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500 mt-1">View all your orders and their status</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {!error && orders.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No Orders</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
                  <div className="mt-6">
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Order Information
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Order Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total Amount
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => {
                        const StatusIcon = ORDER_STATUS[order.status]?.icon || FiPackage;
                        const statusColor = ORDER_STATUS[order.status]?.color || 'text-gray-500';
                        const statusLabel = ORDER_STATUS[order.status]?.label || 'Unknown Status';
                        const isPending = order.status === 'PENDING';

                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                                  <FiPackage className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    Order #{order.orderNumber}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.items.length} items
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <StatusIcon className={`mr-1.5 h-4 w-4 ${statusColor}`} />
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${statusColor.split('-')[1]}-100 text-${statusColor.split('-')[1]}-800`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              ${order.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2 justify-end">
                                <Link
                                  href={`/order-details/${order.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View Details
                                </Link>
                                {isPending && (
                                  <button
                                    onClick={() => confirmDeleteOrder(order.id)}
                                    disabled={isDeleting && deleteOrderId === order.id}
                                    className="text-red-600 hover:text-red-900 ml-3 disabled:opacity-50"
                                  >
                                    {isDeleting && deleteOrderId === order.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 