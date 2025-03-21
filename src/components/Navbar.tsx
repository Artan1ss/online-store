import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiTag, FiHome, FiPackage, FiLogOut, FiLogIn, FiSettings, FiFile } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { itemCount, triggerAnimation } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';
    }
    return router.pathname.startsWith(path) ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">NAMarket</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link 
                href="/"
                className={`inline-flex items-center px-3 pt-1 border-b-2 ${
                  isActive('/') 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-700 hover:text-blue-600 hover:border-gray-300'
                }`}
              >
                <FiHome className="mr-1" />
                Home
              </Link>
              <Link 
                href="/products"
                className={`inline-flex items-center px-3 pt-1 border-b-2 ${
                  isActive('/products') 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-700 hover:text-blue-600 hover:border-gray-300'
                }`}
              >
                <FiPackage className="mr-1" />
                All Products
              </Link>
              <Link 
                href="/deals"
                className={`inline-flex items-center px-3 pt-1 border-b-2 ${
                  isActive('/deals') 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-700 hover:text-blue-600 hover:border-gray-300'
                }`}
              >
                <FiTag className="mr-1" />
                Deals
              </Link>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center">
            <Link 
              href="/cart"
              className="p-2 text-gray-700 hover:text-blue-600 relative"
              aria-label="Shopping Cart"
            >
              <FiShoppingCart className={`h-6 w-6 transition-transform duration-200 ${
                triggerAnimation ? 'scale-125' : 'scale-100'
              }`} />
              {itemCount > 0 && (
                <span className={`absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full transition-all duration-300 ${
                  triggerAnimation ? 'scale-110' : 'scale-100'
                }`}>
                  {itemCount}
                </span>
              )}
            </Link>
            
            {/* User menu */}
            <div className="ml-4 relative">
              <button
                className="p-2 text-gray-700 hover:text-blue-600 flex items-center focus:outline-none"
                onClick={toggleUserMenu}
                aria-label={session ? "User menu" : "Login"}
              >
                <FiUser className="h-6 w-6" />
                {session && (
                  <span className="hidden md:block ml-1 text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                )}
              </button>
              
              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {session ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          {session.user?.name || session.user?.email}
                        </div>
                        <Link 
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiHome className="inline mr-2" /> Profile
                        </Link>
                        <Link 
                          href="/account/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiFile className="inline mr-2" /> Orders
                        </Link>
                        {session.user?.role === 'ADMIN' && (
                          <Link 
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FiSettings className="inline mr-2" /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FiLogOut className="inline mr-1" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link 
                          href="/auth/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiLogIn className="inline mr-1" /> Login
                        </Link>
                        <Link 
                          href="/auth/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden ml-4 p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/') 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiHome className="mr-2" /> Home
          </Link>
          <Link 
            href="/products"
            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/products') 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiPackage className="mr-2" /> All Products
          </Link>
          <Link 
            href="/deals"
            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/deals') 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiTag className="mr-2" /> Deals
          </Link>
          
          {/* Mobile user menu items */}
          {session ? (
            <>
              <div className="border-t border-gray-200 mt-2 pt-2">
                <Link 
                  href="/account"
                  className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiUser className="mr-2" /> Profile
                </Link>
                {session.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin"
                    className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiSettings className="mr-2" /> Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <FiLogOut className="mr-2" /> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link 
                href="/auth/login"
                className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiLogIn className="mr-2" /> Login
              </Link>
              <Link 
                href="/auth/register"
                className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 