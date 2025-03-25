import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiBox, FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import Cookies from 'js-cookie';

// Mock data for the dashboard when database is down
const mockData = {
  stats: {
    totalOrders: 25,
    pendingOrders: 8,
    totalRevenue: 1250.75,
    totalProducts: 42,
    totalUsers: 15
  }
};

export default function BypassDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Super Admin');
  const router = useRouter();

  // Check for super admin cookie on page load
  useEffect(() => {
    const checkAuth = () => {
      const superAdminToken = Cookies.get('super_admin_token');
      const adminName = Cookies.get('super_admin_name') || 'Super Admin';
      
      console.log('Super admin auth check:', { superAdminToken, adminName });
      
      if (superAdminToken === 'SUPER_ADMIN_BYPASS_TOKEN') {
        setAuthorized(true);
        setAdminName(adminName);
      } else {
        // Redirect if not authorized
        router.push('/debug/super-admin');
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('super_admin_token');
    Cookies.remove('super_admin_role');
    Cookies.remove('super_admin_name');
    router.push('/debug/super-admin');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authorized, show access denied (though the redirect should have happened)
  if (!authorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Access Denied</h1>
        <p>You need super admin privileges to view this page.</p>
        <Link href="/debug/super-admin" className="text-blue-500 hover:underline mt-4 inline-block">
          Go to Super Admin Access
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Emergency Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Logged in as: {adminName}</span>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Emergency Mode Active:</strong> You are using the database-bypass admin dashboard. 
                Some features may be limited due to database connectivity issues.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockData.stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockData.stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${mockData.stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <FiPackage className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockData.stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FiUsers className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockData.stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-red-700 font-medium">Database Connection Error</span>
              </div>
              <p className="text-gray-600 mb-4">
                The connection to the database is currently experiencing issues. This is why you're 
                seeing the emergency dashboard. The system will use cached or mock data where possible.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Troubleshooting Steps:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Check database connection settings in your environment variables</li>
                  <li>Verify database server is running and accessible</li>
                  <li>Check for database migration issues</li>
                  <li>Look at Prisma connection pools and limits</li>
                  <li>Check Vercel logs for more detailed error information</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Emergency Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600">
                  The following actions are available even when the database is down:
                </p>
                <Link 
                  href="/"
                  className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  View Frontend Store
                </Link>
                <Link 
                  href="/debug/emergency-admin"
                  className="block w-full text-center bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                >
                  Try Emergency Admin Login
                </Link>
                <Link 
                  href="/debug/admin-bypass"
                  className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                >
                  Try Admin Bypass Page
                </Link>
                <Link 
                  href="/auth/login"
                  className="block w-full text-center bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Normal Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Application</h4>
                <table className="min-w-full">
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Mode</td>
                      <td className="py-1">Emergency / Bypass</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Version</td>
                      <td className="py-1">1.0.0</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Next.js</td>
                      <td className="py-1">13.x</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Authentication</td>
                      <td className="py-1">Cookie-based (Emergency)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Environment</h4>
                <table className="min-w-full">
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Node</td>
                      <td className="py-1">16.x or higher</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Platform</td>
                      <td className="py-1">Vercel</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Admin Mode</td>
                      <td className="py-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Emergency Bypass
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-500">Database</td>
                      <td className="py-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Disconnected
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} NAMarket Admin Console - Emergency Mode
            </p>
            <div className="flex space-x-4">
              <Link 
                href="/"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Home
              </Link>
              <Link 
                href="/debug/super-admin"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Super Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 