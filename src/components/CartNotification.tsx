import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { FiCheck, FiShoppingCart } from 'react-icons/fi';
import Link from 'next/link';

export default function CartNotification() {
  const { triggerAnimation } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;
    
    if (triggerAnimation) {
      setIsVisible(true);
      setIsLeaving(false);
      
      // Start fading out after 2 seconds
      fadeTimer = setTimeout(() => {
        setIsLeaving(true);
      }, 2000);
      
      // Remove from DOM after fade completes
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [triggerAnimation]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 py-2 pointer-events-none">
      <div 
        className={`bg-green-50 border border-green-200 rounded-lg shadow-lg px-4 py-3 flex items-center pointer-events-auto transition-opacity duration-1000 ${
          isLeaving ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transitionProperty: 'opacity',
          transitionDuration: '1000ms',
          transitionTimingFunction: 'ease-out'
        }}
      >
        <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
          <FiCheck className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">
            Item successfully added to cart
          </p>
        </div>
        <Link href="/cart" className="ml-6 text-sm font-medium text-green-600 hover:text-green-500 flex items-center">
          <FiShoppingCart className="mr-1" />
          View Cart
        </Link>
      </div>
    </div>
  );
} 