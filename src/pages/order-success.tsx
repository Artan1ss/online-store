import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiCheck, FiArrowLeft, FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi';
import Layout from '@/components/Layout';

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Make sure orderId exists and is a string
    if (orderId && typeof orderId === 'string') {
      console.log('Fetching order with ID:', orderId);
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add retry logic, maximum 5 attempts, 1 second interval
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          
          if (response.ok) {
            const data = await response.json();
            setOrder(data);
            setLoading(false);
            return; // Successfully fetched data, exit loop
          } else if (response.status === 404 && retries === maxRetries - 1) {
            // Only throw error on the last retry attempt
            throw new Error('Order does not exist or has not been created yet');
          } else {
            // If it's another error or 404 but not the last retry, wait and retry
            console.log(`Retry fetching order ${retries + 1}/${maxRetries}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (retryError) {
          if (retries === maxRetries - 1) {
            throw retryError; // Last retry failed, throw error
          }
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      setError(error.message || 'Failed to fetch order details');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Order Confirmation - NAMarket</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/products" className="flex items-center text-blue-600 hover:text-blue-800">
            <FiArrowLeft className="mr-2" />
            Continue Shopping
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-8 max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order information...</p>
              <p className="mt-2 text-sm text-gray-500">Order is being processed, please wait...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <p className="mt-2 text-gray-600">
                Your order may have been successfully created, but we couldn't retrieve the details.
              </p>
              <p className="mt-2 text-gray-600">
                Please check your email for order confirmation or visit the "My Orders" page.
              </p>
              <div className="mt-6 space-x-4">
                <Link 
                  href="/account/orders" 
                  className="inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View My Orders
                </Link>
                <Link 
                  href="/products" 
                  className="inline-block px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Return to Products
                </Link>
              </div>
            </div>
          ) : order ? (
            <div>
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <FiCheck className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
                <p className="mt-2 text-gray-600">
                  Thank you for your purchase. Your order has been confirmed.
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name:</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Information:</p>
                    <p className="font-medium">{order.customerEmail}</p>
                    {order.customerPhone && <p className="font-medium">{order.customerPhone}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Shipping Address:</p>
                    <p className="font-medium">{`${order.address}, ${order.city}, ${order.country} ${order.postalCode}`}</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                <div className="border-t border-gray-200 pt-4">
                  <ul className="divide-y divide-gray-200">
                    {order.items.map((item: any) => (
                      <li key={item.id} className="py-4 flex">
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">
                          <img
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h4>{item.name}</h4>
                            <p className="text-base font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-6">
                  A confirmation email has been sent to your email address.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiHome className="mr-2" /> Return to Home
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiShoppingBag className="mr-2" /> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Order information not found</p>
              <Link href="/products" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                Return to Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 