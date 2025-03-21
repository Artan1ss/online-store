import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiPackage, FiTruck, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';

const ORDER_STATUS = {
  PENDING: { label: 'Pending', icon: FiClock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  PROCESSING: { label: 'Processing', icon: FiPackage, color: 'text-blue-500', bg: 'bg-blue-100' },
  SHIPPED: { label: 'Shipped', icon: FiTruck, color: 'text-purple-500', bg: 'bg-purple-100' },
  DELIVERED: { label: 'Delivered', icon: FiCheck, color: 'text-green-500', bg: 'bg-green-100' },
  CANCELLED: { label: 'Cancelled', icon: FiX, color: 'text-red-500', bg: 'bg-red-100' }
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  product?: {
    id: string;
    name: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: keyof typeof ORDER_STATUS;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && status !== 'loading') {
      fetchOrderDetails();
    }
  }, [id, status]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/orders/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (response.status === 404) {
        setError('Order does not exist or has been deleted');
      } else if (response.status === 403) {
        setError('You do not have permission to access this order');
      } else {
        setError('Failed to get order details');
      }
    } catch (error) {
      console.error('Error retrieving order details:', error);
      setError('Unable to load order details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-6">
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
              <p className="mt-1 text-sm text-gray-500">Unable to view order details</p>
              <div className="mt-6">
                <Link
                  href="/account/orders"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiArrowLeft className="mr-2" /> Return to Orders List
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-6">
              <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Order Not Found</h3>
              <div className="mt-6">
                <Link
                  href="/account/orders"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiArrowLeft className="mr-2" /> Return to Orders List
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = ORDER_STATUS[order.status]?.icon || FiPackage;
  const statusColor = ORDER_STATUS[order.status]?.color || 'text-gray-500';
  const statusBg = ORDER_STATUS[order.status]?.bg || 'bg-gray-100';
  const statusLabel = ORDER_STATUS[order.status]?.label || 'Unknown status';

  return (
    <Layout>
      <Head>
        <title>Order #{order.orderNumber} | NAMarket</title>
        <meta name="description" content={`Order details #${order.orderNumber}`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/account/orders" className="flex items-center text-blue-600 hover:text-blue-800">
            <FiArrowLeft className="mr-2" />
            Return to Orders List
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="mt-1 text-sm text-gray-500">Order Date: {formatDate(order.createdAt)}</p>
              </div>
              <div className={`mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-full ${statusBg}`}>
                <StatusIcon className={`mr-2 h-5 w-5 ${statusColor}`} />
                <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Shipping Information</h2>
                <div className="space-y-2">
                  <p className="text-sm"><span className="text-gray-500">Recipient:</span> {order.customerName}</p>
                  <p className="text-sm"><span className="text-gray-500">Contact:</span> {order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {order.customerPhone}</p>
                  )}
                  <p className="text-sm">
                    <span className="text-gray-500">Address:</span> {order.address}, {order.city}, {order.country} {order.postalCode}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h2>
                <div className="space-y-2">
                  <p className="text-sm"><span className="text-gray-500">Order Status:</span> {statusLabel}</p>
                  <p className="text-sm"><span className="text-gray-500">Payment Method:</span> {order.paymentMethod || 'Not Specified'}</p>
                  <p className="text-sm"><span className="text-gray-500">Items Count:</span> {order.items.reduce((acc, item) => acc + item.quantity, 0)} items</p>
                  <p className="text-sm"><span className="text-gray-500">Total Amount:</span> ${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border border-gray-200">
                              <img 
                                src={item.image || (item.product?.images && item.product.images.length > 0 ? item.product.images[0] : '/placeholder.png')}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              {item.product && (
                                <Link
                                  href={`/products/${item.product.id}`}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  View Product
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th scope="row" colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        Total
                      </th>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 