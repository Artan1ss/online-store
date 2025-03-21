import React from 'react';
import Link from 'next/link';
import { FiMail, FiPhone, FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Us</h3>
            <p className="text-gray-600 mb-4">
              NAMarket is your trusted online shopping platform, offering high-quality products and excellent service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-500">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-500">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-500">
                <FiInstagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-500">Home</Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-blue-500">All Products</Link>
              </li>
              <li>
                <Link href="/deals" className="text-gray-600 hover:text-blue-500">Deals</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <FiMail className="mr-2" /> support@namarket.com
              </li>
              <li className="flex items-center text-gray-600">
                <FiPhone className="mr-2" /> +1 (123) 456-7890
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NAMarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 