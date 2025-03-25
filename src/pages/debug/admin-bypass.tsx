import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

type DebugResponse = {
  success: boolean;
  message: string;
  loginInfo?: {
    email: string;
    password: string;
  };
  userInfo?: {
    id: string;
    email: string;
    role: string;
  };
  environment?: Record<string, string>;
  instructions?: string;
  error?: string;
};

export default function AdminBypass() {
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const router = useRouter();

  const generateDebugAdmin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug/admin-bypass');
      const data: DebugResponse = await res.json();
      setResponse(data);
      
      // Auto-login if requested and credentials exist
      if (autoLogin && data.success && data.loginInfo) {
        await handleLogin(data.loginInfo.email, data.loginInfo.password);
      }
    } catch (error) {
      console.error('Error generating debug admin:', error);
      setResponse({
        success: false,
        message: 'Error generating debug admin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (result?.error) {
        console.error('Error logging in:', result.error);
      } else {
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Head>
        <title>Admin Bypass Debug</title>
      </Head>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Bypass Debug</h1>
        <Link 
          href="/debug/admin-login"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Admin Login
        </Link>
      </div>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
        <p className="text-red-800 text-sm">
          <strong>Warning:</strong> This page is for debugging purposes only. 
          It creates a special admin user that bypasses normal authentication flows.
          Do not use in a real production environment.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Generate Debug Admin</h2>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={() => setAutoLogin(!autoLogin)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-login after credentials are generated</span>
            </label>
          </div>
          <button
            onClick={generateDebugAdmin}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Debug Admin'}
          </button>
        </div>
      </div>
      
      {response && (
        <div className={`bg-white shadow rounded-lg overflow-hidden mb-6 ${response.success ? '' : 'border border-red-300'}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Debug Response</h2>
          </div>
          <div className="p-4">
            <div className={`p-3 rounded text-sm mb-4 ${response.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {response.message}
            </div>
            
            {response.loginInfo && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Login Information</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Email:</strong> {response.loginInfo.email}</p>
                  <p><strong>Password:</strong> {response.loginInfo.password}</p>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleLogin(response.loginInfo!.email, response.loginInfo!.password)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Login with these credentials
                  </button>
                </div>
              </div>
            )}
            
            {response.userInfo && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">User Information</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>ID:</strong> {response.userInfo.id}</p>
                  <p><strong>Email:</strong> {response.userInfo.email}</p>
                  <p><strong>Role:</strong> {response.userInfo.role}</p>
                </div>
              </div>
            )}
            
            {response.environment && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Environment Information</h3>
                <div className="bg-gray-50 p-3 rounded">
                  {Object.entries(response.environment).map(([key, value]) => (
                    <p key={key}><strong>{key}:</strong> {value}</p>
                  ))}
                </div>
              </div>
            )}
            
            {response.error && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Error</h3>
                <div className="bg-red-50 p-3 rounded text-red-800">
                  {response.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 