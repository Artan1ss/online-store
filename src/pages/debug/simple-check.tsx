import { useState, useEffect } from 'react';
import Head from 'next/head';

interface DatabaseInfo {
  tables: {
    product?: {
      count?: number;
      status: string;
      error?: string;
    };
  };
}

interface CheckResult {
  status: string;
  message: string;
  connected?: boolean;
  success?: boolean;
  info?: DatabaseInfo;
  details?: any;
  error?: string | any;
  timestamp: string;
}

export default function SimpleDbCheck() {
  const [checkDbResult, setCheckDbResult] = useState<CheckResult | null>(null);
  const [testConnResult, setTestConnResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setLoading('check-db');
    setError(null);
    
    try {
      const response = await fetch('/api/check-db');
      const data = await response.json();
      setCheckDbResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while checking the database');
    } finally {
      setLoading(null);
    }
  };

  const testConnection = async () => {
    setLoading('test-conn');
    setError(null);
    
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setTestConnResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while testing the connection');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Database Connection Check</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">Database Connection Check</h1>
      
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        {/* Test Connection Section */}
        <div className="flex-1 border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Connection Test (dbService)</h2>
          <p className="mb-4 text-gray-600">Tests database connection using the enhanced dbService.</p>
          
          <div className="mb-6">
            <button
              onClick={testConnection}
              disabled={loading !== null}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading === 'test-conn' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          
          {testConnResult && (
            <div className={`border rounded p-4 mb-4 ${testConnResult.status === 'success' ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
              <h3 className="text-lg font-semibold mb-2">
                Status: {testConnResult.status === 'success' ? 'Connected' : 'Connection Failed'}
              </h3>
              <p className="mb-2">{testConnResult.message}</p>
              
              {testConnResult.error && (
                <div className="bg-red-50 p-3 rounded mb-3">
                  <p className="font-medium">Error details:</p>
                  <pre className="whitespace-pre-wrap text-sm">{
                    typeof testConnResult.error === 'string' 
                      ? testConnResult.error 
                      : JSON.stringify(testConnResult.error, null, 2)
                  }</pre>
                </div>
              )}
              
              {testConnResult.details && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Details:</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(testConnResult.details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                Timestamp: {new Date(testConnResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        {/* Database Check Section */}
        <div className="flex-1 border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Database Check (Prisma Raw)</h2>
          <p className="mb-4 text-gray-600">Checks database connection and product counts using a Prisma raw client.</p>
          
          <div className="mb-6">
            <button
              onClick={checkDatabase}
              disabled={loading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading === 'check-db' ? 'Checking...' : 'Check Database'}
            </button>
          </div>
          
          {checkDbResult && (
            <div className={`border rounded p-4 mb-4 ${checkDbResult.connected ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
              <h3 className="text-lg font-semibold mb-2">
                Status: {checkDbResult.connected ? 'Connected' : 'Connection Failed'}
              </h3>
              <p className="mb-2">{checkDbResult.message}</p>
              
              {checkDbResult.error && (
                <div className="bg-red-50 p-3 rounded mb-3">
                  <p className="font-medium">Error details:</p>
                  <pre className="whitespace-pre-wrap text-sm">{checkDbResult.error}</pre>
                </div>
              )}
              
              {checkDbResult.info && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Database Information:</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border text-left">Table</th>
                          <th className="py-2 px-4 border text-left">Status</th>
                          <th className="py-2 px-4 border text-left">Count</th>
                          <th className="py-2 px-4 border text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-4 border">Products</td>
                          <td className={`py-2 px-4 border ${checkDbResult.info.tables.product?.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                            {checkDbResult.info.tables.product?.status === 'ok' ? 'Available' : 'Error'}
                          </td>
                          <td className="py-2 px-4 border">
                            {checkDbResult.info.tables.product?.count !== undefined ? checkDbResult.info.tables.product.count : '-'}
                          </td>
                          <td className="py-2 px-4 border">
                            {checkDbResult.info.tables.product?.error || '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                Timestamp: {new Date(checkDbResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Verify your DATABASE_URL in Vercel environment variables</li>
          <li>Check if your database server allows connections from Vercel IPs</li>
          <li>Make sure your database is running and accessible</li>
          <li>Review Vercel logs for more detailed error information</li>
          <li>Confirm your Prisma schema matches your database schema</li>
        </ul>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>For more advanced diagnostics, visit the <a href="/debug/database" className="text-blue-500 hover:underline">Database Debug Dashboard</a>.</p>
      </div>
    </div>
  );
} 