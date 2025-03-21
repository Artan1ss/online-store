import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiTrash2, FiMinus, FiPlus, FiTag } from 'react-icons/fi';
import NoFooterLayout from '@/components/NoFooterLayout';
import { useCart } from '@/contexts/CartContext';
import Footer from '@/components/Footer';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useCart();

  // Calculate total price
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <NoFooterLayout>
      <Head>
        <title>Shopping Cart - NAMarket</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <Link 
            href="/products" 
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <FiArrowLeft className="mr-2" /> Continue Shopping
          </Link>
        </div>

        {itemCount === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/products" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-6 px-6 py-4 border-b border-gray-200 bg-gray-50 hidden">
              <div className="lg:col-span-6">
                <h2 className="text-sm font-medium text-gray-900">Product</h2>
              </div>
              <div className="lg:col-span-2 text-center">
                <h2 className="text-sm font-medium text-gray-900">Price</h2>
              </div>
              <div className="lg:col-span-2 text-center">
                <h2 className="text-sm font-medium text-gray-900">Quantity</h2>
              </div>
              <div className="lg:col-span-2 text-right">
                <h2 className="text-sm font-medium text-gray-900">Total</h2>
              </div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="lg:grid lg:grid-cols-12 lg:gap-x-6 p-6 border-b border-gray-200">
                <div className="flex lg:col-span-6">
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-base font-medium text-gray-900">
                          <Link href={`/products/${item.id}`} className="hover:text-blue-600">
                            {item.name}
                          </Link>
                        </h3>
                      </div>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="mt-1 flex items-center">
                          <FiTag className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-xs text-red-500 font-medium">On Sale</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-end justify-between text-sm lg:hidden">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500 disabled:opacity-50"
                        >
                          <FiMinus className="h-4 w-4" />
                        </button>
                        <span className="text-gray-500 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="font-medium text-red-600 hover:text-red-500 flex items-center"
                      >
                        <FiTrash2 className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 flex justify-center items-center mt-4 lg:mt-0">
                  <span className="text-sm text-gray-900">
                    ${item.price.toFixed(2)}
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="ml-2 text-xs text-gray-500 line-through">${item.originalPrice.toFixed(2)}</span>
                    )}
                  </span>
                </div>

                <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    >
                      <FiMinus className="h-4 w-4" />
                    </button>
                    <span className="text-gray-900 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                    >
                      <FiPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 flex justify-end items-center mt-4 lg:mt-0">
                  <span className="text-base font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="ml-4 font-medium text-red-600 hover:text-red-500 hidden lg:flex items-center"
                  >
                    <FiTrash2 className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="p-6 flex justify-between items-center">
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
              >
                <FiTrash2 className="h-4 w-4 mr-1" />
                Clear Cart
              </button>
              <div className="text-right">
                <h3 className="text-base font-medium text-gray-900">Subtotal</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        {itemCount > 0 && (
          <div className="flex justify-end mt-8">
            <Link href="/checkout" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </NoFooterLayout>
  );
} 