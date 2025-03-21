import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiCheck, FiHome, FiShoppingBag } from 'react-icons/fi';
import Layout from '@/components/Layout';

export default function OrderConfirmationPage() {
  // Generate random order number
  const orderNumber = `ORD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  
  return (
    <Layout>
      <Head>
        <title>Order Confirmation - NAMarket</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <FiCheck className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your purchase! Your order has been successfully submitted.
              </p>
              
              <div className="w-full max-w-md bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{orderNumber}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className="font-medium text-green-600">Confirmed</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                We have sent an order confirmation email to your inbox, which includes order details and tracking information.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link 
                  href="/"
                  className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiHome className="mr-2" />
                  Return Home
                </Link>
                <Link 
                  href="/products"
                  className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiShoppingBag className="mr-2" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 