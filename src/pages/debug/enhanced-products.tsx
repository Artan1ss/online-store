import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
};

type DebugResult = {
  status: string;
  message: string;
  data?: any;
  metadata?: any;
  error?: any;
  timestamp?: string;
};

export default function EnhancedProductsDebugPage() {
  const [regularResult, setRegularResult] = useState<DebugResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<DebugResult | null>(null);
  const [directResult, setDirectResult] = useState<DebugResult | null>(null);
  const [isRegularLoading, setIsRegularLoading] = useState(false);
  const [isEnhancedLoading, setIsEnhancedLoading] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegularProducts = async () => {
    setError(null);
    setIsRegularLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/products/public');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setRegularResult({
        ...data,
        metadata: {
          ...(data.metadata || {}),
          responseTime: `${responseTime}ms`
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setRegularResult({
        status: 'error',
        message: 'Failed to fetch regular products',
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRegularLoading(false);
    }
  };

  const fetchEnhancedProducts = async () => {
    setError(null);
    setIsEnhancedLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/enhanced-products');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setEnhancedResult({
        ...data,
        metadata: {
          ...(data.metadata || {}),
          responseTime: `${responseTime}ms`
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setEnhancedResult({
        status: 'error',
        message: 'Failed to fetch enhanced products',
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsEnhancedLoading(false);
    }
  };

  const testDbConnection = async () => {
    setError(null);
    setIsDirectLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/test-vercel-db');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDirectResult({
        ...data,
        metadata: {
          responseTime: `${responseTime}ms`
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setDirectResult({
        status: 'error',
        message: 'Failed to test direct database connection',
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsDirectLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) return `${seconds} seconds ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minutes ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      return `${days} days ago`;
    } catch (e) {
      return 'Unknown time';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Enhanced Products Debug</title>
      </Head>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced Database Connection Debugging</h1>
        <p className="text-gray-600 mb-4">
          Compare different database connection approaches for Vercel deployment
        </p>
        <div className="flex space-x-4">
          <Link href="/debug/products" className="text-blue-500 hover:underline">
            Regular Debug
          </Link>
          <Link href="/" className="text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">Regular API Endpoint</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tests the standard products API endpoint using default connection
          </p>
          <button
            onClick={fetchRegularProducts}
            disabled={isRegularLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full"
          >
            {isRegularLoading ? 'Loading...' : 'Test Regular API'}
          </button>
        </div>

        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">Enhanced API Endpoint</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tests the enhanced products API with optimized connection URL
          </p>
          <button
            onClick={fetchEnhancedProducts}
            disabled={isEnhancedLoading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2 w-full"
          >
            {isEnhancedLoading ? 'Loading...' : 'Test Enhanced API'}
          </button>
        </div>

        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">Direct DB Connection</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tests direct database connectivity with diagnostics
          </p>
          <button
            onClick={testDbConnection}
            disabled={isDirectLoading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-2 w-full"
          >
            {isDirectLoading ? 'Loading...' : 'Test Direct Connection'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {regularResult && (
          <div className="border rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">Regular API Result</h2>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p><span className="font-semibold">Status:</span> {regularResult.status}</p>
              <p><span className="font-semibold">Message:</span> {regularResult.message}</p>
              {regularResult.metadata && (
                <>
                  <p><span className="font-semibold">Response Time:</span> {regularResult.metadata.responseTime}</p>
                  <p><span className="font-semibold">Timestamp:</span> {regularResult.timestamp && formatTimeAgo(regularResult.timestamp)}</p>
                </>
              )}
            </div>
            
            {regularResult.data?.products && (
              <div>
                <h3 className="font-bold mb-2">Products Found: {regularResult.data.products.length}</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regularResult.data.products.slice(0, 5).map((product: Product) => (
                        <tr key={product.id}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{product.id}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{product.name}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">${product.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {regularResult.error && (
              <div className="mt-4 bg-red-100 p-3 rounded">
                <p className="font-bold">Error Details:</p>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(regularResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {enhancedResult && (
          <div className="border rounded shadow p-4">
            <h2 className="text-xl font-bold mb-2">Enhanced API Result</h2>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p><span className="font-semibold">Status:</span> {enhancedResult.status}</p>
              <p><span className="font-semibold">Message:</span> {enhancedResult.message}</p>
              {enhancedResult.metadata && (
                <>
                  <p><span className="font-semibold">Response Time:</span> {enhancedResult.metadata.responseTime}</p>
                  <p><span className="font-semibold">Connection Type:</span> {enhancedResult.metadata.connectionType}</p>
                  <p><span className="font-semibold">Environment:</span> {enhancedResult.metadata.environment}</p>
                  <p><span className="font-semibold">Timestamp:</span> {enhancedResult.timestamp && formatTimeAgo(enhancedResult.timestamp)}</p>
                </>
              )}
            </div>
            
            {enhancedResult.data?.products && (
              <div>
                <h3 className="font-bold mb-2">Products Found: {enhancedResult.data.products.length}</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedResult.data.products.slice(0, 5).map((product: Product) => (
                        <tr key={product.id}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{product.id}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{product.name}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">${product.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {enhancedResult.error && (
              <div className="mt-4 bg-red-100 p-3 rounded">
                <p className="font-bold">Error Details:</p>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(enhancedResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {directResult && (
        <div className="mt-8 border rounded shadow p-4">
          <h2 className="text-xl font-bold mb-2">Direct Database Connection Results</h2>
          <div className="bg-gray-100 p-3 rounded mb-4">
            <p><span className="font-semibold">Status:</span> {directResult.status}</p>
            <p><span className="font-semibold">Message:</span> {directResult.message}</p>
            {directResult.metadata && (
              <p><span className="font-semibold">Response Time:</span> {directResult.metadata.responseTime}</p>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <pre className="text-xs bg-gray-50 p-4 rounded">
              {JSON.stringify(directResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 p-4 rounded border border-blue-200">
        <h2 className="text-xl font-bold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Compare response times</strong> between regular and enhanced connections to see performance differences
          </li>
          <li>
            <strong>Check for connection errors</strong> in the Direct Database test which may indicate Supabase constraints
          </li>
          <li>
            <strong>Verify IP restrictions</strong> in your Supabase dashboard - Vercel's servers need to be allowed
          </li>
          <li>
            <strong>Review connection pooling settings</strong> - Supabase may require specific pooling configurations for serverless functions
          </li>
          <li>
            <strong>Connection limits</strong> - Free tier Supabase has limited concurrent connections, check if you're hitting these limits
          </li>
        </ul>
      </div>
    </div>
  );
} 