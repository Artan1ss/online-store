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
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Head>
        <title>Admin Debug Login</title>
      </Head>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Debug Login</h1>
        <div className="flex space-x-4">
          <Link 
            href="/debug/admin-bypass"
            className="text-purple-600 hover:text-purple-800"
          >
            Try Admin Bypass
          </Link>
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
        <p className="text-yellow-800 text-sm">
          This is a debug page for troubleshooting admin login issues in production.
          Do not expose this in a real production environment.
        </p>
      </div>
      
      {/* Test Connection Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Test Database Connection</h2>
        </div>
        <div className="p-4">
          <button
            onClick={testDatabaseConnection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={connectionLoading}
          >
            {connectionLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          {connectionStatus && (
            <div className={`mt-4 p-3 rounded text-sm ${connectionStatus.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <pre className="whitespace-pre-wrap overflow-auto max-h-60">{connectionStatus}</pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Admin Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Create/Verify Admin User</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Creates a default admin user with email "admin@example.com" if one doesn't exist.
            <br />
            <span className="text-red-600 font-medium">
              If this fails, try the Admin Bypass option instead.
            </span>
          </p>
          <button
            onClick={createAdminUser}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create/Verify Admin User'}
          </button>
        </div>
      </div>
      
      {/* Login Form */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Admin Login</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 p-4 rounded text-red-600 text-sm">{error}</div>
            )}
            
            {success && (
              <div className="bg-green-50 p-4 rounded text-green-600 text-sm">{success}</div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 