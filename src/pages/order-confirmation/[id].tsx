import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiCheckCircle, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import Layout from '@/components/Layout';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
};

export default function OrderConfirmation() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to load order information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Order Confirmation - NAMarket</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <Head>
          <title>Order Confirmation - NAMarket</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Information Unavailable</h1>
            <p className="text-gray-600 mb-6">{error || 'Cannot find order information.'}</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Return to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Format date
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'PAYPAL':
        return 'PayPal';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Order Confirmation - NAMarket</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <FiArrowLeft className="mr-2" />
            Return to Home
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6 bg-green-50 border-b border-green-100 flex items-center">
            <FiCheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Confirmed</h1>
              <p className="text-gray-600">Thank you for your purchase! Your order has been successfully submitted.</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Order Information</h2>
                <p className="text-gray-600">Order Number: <span className="font-medium">{order.id}</span></p>
                <p className="text-gray-600">Order Date: <span className="font-medium">{orderDate}</span></p>
                <p className="text-gray-600">Payment Method: <span className="font-medium">{formatPaymentMethod(order.paymentMethod)}</span></p>
                <p className="text-gray-600">Order Status: <span className="font-medium text-green-600">Confirmed</span></p>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Shipping Information</h2>
                <p className="text-gray-600">Recipient: <span className="font-medium">{order.customerName}</span></p>
                <p className="text-gray-600">Email: <span className="font-medium">{order.customerEmail}</span></p>
                <p className="text-gray-600">Address: <span className="font-medium">{order.shippingAddress}</span></p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="flow-root">
                <ul className="-my-6 divide-y divide-gray-200">
                  {order.orderItems.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <p className="text-gray-500">Quantity {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                <p>Total</p>
                <p>${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-6">Order confirmation email has been sent to your email.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products" className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FiShoppingBag className="mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 