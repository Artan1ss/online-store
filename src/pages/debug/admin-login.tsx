import { useState } from 'react';
import { signIn, SignInResponse } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Define types for API responses
type ConnectionResponse = {
  success: boolean;
  message: string;
  error?: string;
  timestamp?: string;
  serverTime?: Date;
  database?: string;
  stats?: {
    userCount: number;
  };
  [key: string]: any;
};

type AdminUserResponse = {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
  password?: string;
  [key: string]: any;
};

export default function AdminLoginDebug() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setConnectionLoading(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/debug/test-connection');
      const data: ConnectionResponse = await response.json();
      
      if (response.ok) {
        setConnectionStatus(`Connection successful: ${JSON.stringify(data, null, 2)}`);
      } else {
        setConnectionStatus(`Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setConnectionStatus(`Error testing connection: ${errorMessage}`);
    } finally {
      setConnectionLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/debug/create-admin', {
        method: 'POST'
      });
      
      const data: AdminUserResponse = await response.json();
      
      if (response.ok) {
        setSuccess(`Admin user ${data.message ? 'created/verified' : 'processed'}: ${data.email || 'admin@example.com'}. ${data.password ? 'Check console for password.' : ''}`);
        if (data.password) {
          console.log('Admin password:', 'Admin123!');
        }
      } else {
        setError(`Failed to create admin: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Error creating admin: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Admin Login Debug</title>
      </Head>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login Debug</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use these options to debug admin access issues
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Debug Options</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose one of the options below to help debug admin access issues:
              </p>
            </div>

            <div className="space-y-4">
              <Link 
                href="/debug/admin-bypass"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Admin User (Bypass)
              </Link>
              
              <Link 
                href="/debug/emergency-admin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Emergency Admin Access
              </Link>

              <Link 
                href="/debug/super-admin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Super Admin (Cookie Bypass)
              </Link>
              
              <Link 
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Regular Admin Login
              </Link>
              
              <Link 
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
              </Link>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> These options are for debugging only. 
                    Use the regular login for normal operation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 