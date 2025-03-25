import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function EmergencyAdminAccess() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();

  const emergencyCredentials = {
    email: 'emergency@admin.com',
    password: 'EmergencyAdmin123!'
  };

  const handleEmergencyLogin = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setDebugInfo(null);
      
      console.log('Attempting emergency login with:', emergencyCredentials.email);
      
      const result = await signIn('credentials', {
        redirect: false,
        email: emergencyCredentials.email,
        password: emergencyCredentials.password,
        callbackUrl: '/admin/dashboard'
      });
      
      console.log('SignIn result:', JSON.stringify(result));
      setDebugInfo(JSON.stringify(result, null, 2));
      
      if (result?.error) {
        setMessage(`Login failed: ${result.error}`);
        console.error('Login error:', result.error);
      } else if (result?.url) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = result.url; // Use window.location instead of router for hard redirect
        }, 1500);
      } else {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/admin/dashboard'; // Fallback redirect
        }, 1500);
      }
    } catch (error) {
      console.error('Emergency login exception:', error);
      setMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setDebugInfo(error instanceof Error ? error.stack || 'No stack trace' : 'Unknown error type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Head>
        <title>Emergency Admin Access</title>
      </Head>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Emergency Admin Access</h1>
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
          <strong>Critical Warning:</strong> This page provides emergency admin access. 
          This should only be used when regular admin login methods fail.
          This credentials bypass normal database operations for emergency access.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Emergency Admin Credentials</h2>
        </div>
        <div className="p-4">
          <div className="bg-gray-50 p-3 rounded mb-4">
            <p><strong>Email:</strong> {emergencyCredentials.email}</p>
            <p><strong>Password:</strong> {emergencyCredentials.password}</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleEmergencyLogin}
              className="w-full bg-red-600 text-white p-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Emergency Admin'}
            </button>
            
            {message && (
              <div className={`p-3 rounded text-sm ${message.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}
            
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Instructions</h2>
        </div>
        <div className="p-4">
          <ol className="list-decimal pl-4 space-y-2">
            <li>These emergency credentials bypass the database completely</li>
            <li>After login, you'll have admin access to view your dashboard</li>
            <li>Some dashboard features may be limited since database connection issues persist</li>
            <li>Once logged in, use the admin dashboard to troubleshoot database issues</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-blue-800 text-sm">
            <p><strong>Note:</strong> These credentials are hardcoded in the application and are intended for emergencies only.</p>
          </div>
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