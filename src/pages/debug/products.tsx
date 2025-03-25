import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ProductsDebugPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch debug data
  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug-products');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugData(data);
    } catch (err) {
      console.error('Error fetching debug data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch API data
  const fetchApiData = async () => {
    try {
      setApiLoading(true);
      setApiError(null);
      
      const response = await fetch('/api/products/public');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setApiData(data);
    } catch (err) {
      console.error('Error fetching API data:', err);
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Products Debug Page</title>
      </Head>
      
      <div className="mb-6">
        <Link href="/debug/simple-check" className="text-blue-500 hover:underline mb-2 inline-block">
          &larr; Back to Database Diagnostics
        </Link>
        <h1 className="text-2xl font-bold">Products Debug Page</h1>
        <p className="text-gray-600 mt-2">Use this page to troubleshoot product data retrieval issues</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Debug Endpoint Test</h2>
          <p className="mb-4 text-gray-600">Tests the database connection and product retrieval directly.</p>
          
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 mb-4"
          >
            {loading ? 'Loading...' : 'Test Debug Endpoint'}
          </button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          {debugData && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Debug Results:</h3>
              
              <div className="bg-gray-50 p-3 rounded mb-3">
                <p><strong>Status:</strong> {debugData.status}</p>
                <p><strong>Message:</strong> {debugData.message}</p>
                <p><strong>Connection Test:</strong> {debugData.data?.connectionTest ? 'Success' : 'Failed'}</p>
                <p><strong>Product Count:</strong> {debugData.data?.productCount}</p>
              </div>
              
              {debugData.data?.sampleProducts && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Sample Products:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border text-left">ID</th>
                          <th className="py-2 px-4 border text-left">Name</th>
                          <th className="py-2 px-4 border text-left">Price</th>
                          <th className="py-2 px-4 border text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.data.sampleProducts.map((product: any) => (
                          <tr key={product.id}>
                            <td className="py-2 px-4 border">{product.id}</td>
                            <td className="py-2 px-4 border">{product.name}</td>
                            <td className="py-2 px-4 border">${product.price.toFixed(2)}</td>
                            <td className="py-2 px-4 border">{product.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {debugData.data?.fullSampleData && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Full Product Schema:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(debugData.data.fullSampleData, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Database Info:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugData.data?.databaseInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Products API Test</h2>
          <p className="mb-4 text-gray-600">Tests the public products API endpoint.</p>
          
          <button
            onClick={fetchApiData}
            disabled={apiLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300 mb-4"
          >
            {apiLoading ? 'Loading...' : 'Test Products API'}
          </button>
          
          {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Error:</strong> {apiError}</p>
            </div>
          )}
          
          {apiData && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">API Results:</h3>
              
              <div className="bg-gray-50 p-3 rounded mb-3">
                <p><strong>Status:</strong> {apiData.status}</p>
                <p><strong>Message:</strong> {apiData.message}</p>
                <p><strong>Product Count:</strong> {apiData.data?.pagination?.total}</p>
                <p><strong>Products Returned:</strong> {apiData.data?.products?.length}</p>
              </div>
              
              {apiData.data?.products && apiData.data.products.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">First Product Data:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(apiData.data.products[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>If the debug endpoint works but the API doesn't, check API query parameters and filtering logic</li>
          <li>Compare the product schema from both endpoints to identify any field discrepancies</li>
          <li>Check if the products API is correctly handling the response format that the frontend expects</li>
          <li>Verify that any necessary type conversions are happening on both client and server</li>
          <li>Look for missing or null fields that might be causing issues</li>
        </ul>
      </div>
    </div>
  );
} 