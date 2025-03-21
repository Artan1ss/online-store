import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { FiAlertTriangle } from 'react-icons/fi';

export default function AdminIndex() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is loading
    if (status === 'loading') return;
    
    // If not authenticated, redirect to login
    if (!session) {
      router.push('/auth/login?callbackUrl=/admin');
      return;
    }
    
    // If not admin, show error
    if (session.user?.role !== 'ADMIN') {
      setError('You do not have permission to access the admin dashboard');
      return;
    }
    
    // Otherwise, redirect to admin dashboard
    router.push('/admin/dashboard');
  }, [session, status, router]);

  // If there's an error, show error message
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center bg-white shadow-md rounded-lg p-8 max-w-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Admin Panel</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
} 