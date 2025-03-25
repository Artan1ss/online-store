import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

// Direct admin access without NextAuth
export default function SuperAdminAccess() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  const superAdminCredentials = {
    username: 'superadmin',
    password: 'SuperAdmin123!'
  };

  // Check if already authenticated on page load
  useEffect(() => {
    const superAdminToken = Cookies.get('super_admin_token');
    if (superAdminToken === 'SUPER_ADMIN_BYPASS_TOKEN') {
      setAuthenticated(true);
      setMessage('Already authenticated as Super Admin');
    }
  }, []);

  const handleSuperAdminLogin = () => {
    try {
      setLoading(true);
      setMessage(null);
      
      console.log('Activating super admin mode');
      
      // Set a simple cookie to indicate super admin status
      // Note: This is not secure for production, but works for emergency access
      Cookies.set('super_admin_token', 'SUPER_ADMIN_BYPASS_TOKEN', { expires: 1 }); // 1 day expiry
      Cookies.set('super_admin_role', 'ADMIN', { expires: 1 });
      Cookies.set('super_admin_name', 'Super Admin', { expires: 1 });
      
      setAuthenticated(true);
      setMessage('Super Admin mode activated successfully!');
    } catch (error) {
      console.error('Super admin activation failed:', error);
      setMessage(`Failed to activate Super Admin mode: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSuperAdmin = () => {
    Cookies.remove('super_admin_token');
    Cookies.remove('super_admin_role');
    Cookies.remove('super_admin_name');
    setAuthenticated(false);
    setMessage('Super Admin mode deactivated');
  };

  const handleGoToDashboard = () => {
    // Add a small delay to ensure cookies are set
    setLoading(true);
    setTimeout(() => {
      window.location.href = '/admin/bypass-dashboard';
    }, 500);
  };

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Head>
        <title>Super Admin Access</title>
      </Head>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Super Admin Access</h1>
        <div className="flex space-x-4">
          <Link 
            href="/debug/admin-login"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Admin Login
          </Link>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
        <p className="text-red-800 text-sm">
          <strong>CRITICAL WARNING:</strong> This page provides a direct bypass to access admin features.
          This completely bypasses NextAuth and all database checks. Use only in emergency situations when
          all other methods fail.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Super Admin Access</h2>
        </div>
        <div className="p-4">
          {authenticated ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded text-green-800">
                <p className="font-medium">Super Admin Mode Active</p>
                <p className="text-sm mt-1">You now have direct access to admin features</p>
              </div>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Redirecting...' : 'Go to Admin Dashboard'}
              </button>
              
              <button
                onClick={handleClearSuperAdmin}
                className="w-full bg-gray-100 text-gray-800 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Deactivate Super Admin Mode
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p><strong>Username:</strong> {superAdminCredentials.username}</p>
                <p><strong>Password:</strong> {superAdminCredentials.password}</p>
              </div>
              
              <button
                onClick={handleSuperAdminLogin}
                className="w-full bg-red-600 text-white p-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Activating...' : 'Activate Super Admin Mode'}
              </button>
            </div>
          )}
          
          {message && (
            <div className={`mt-4 p-3 rounded text-sm ${authenticated ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">How This Works</h2>
        </div>
        <div className="p-4">
          <ul className="list-disc pl-4 space-y-2 text-sm">
            <li>This page uses client-side cookies to bypass the NextAuth system</li>
            <li>It doesn't require any database queries to work</li>
            <li>The admin dashboard will check for these cookies and grant access</li>
            <li>This should work even when database connections are completely broken</li>
            <li>Security is minimal - only use in emergencies</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link 
          href="/"
          className="text-gray-600 hover:text-gray-800"
        >
          Return to Home Page
        </Link>
      </div>
    </div>
  );
} 