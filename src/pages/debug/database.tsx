import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function DatabaseDebugPage() {
  const router = useRouter();
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<any>(null);
  
  // Check diagnostics
  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/diagnostic');
      const data = await response.json();
      
      setDiagnosticResult(data);
    } catch (err: any) {
      setError(`Error running diagnostics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset database connection
  const resetConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/force-deploy', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResetResult(data);
    } catch (err: any) {
      setError(`Error resetting connection: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Verify schema
  const verifySchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/verify-schema');
      const data = await response.json();
      
      setDiagnosticResult(data);
    } catch (err: any) {
      setError(`Error verifying schema: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check the products API directly
  const checkProductsApi = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products/public');
      const data = await response.json();
      
      setDiagnosticResult(data);
    } catch (err: any) {
      setError(`Error checking products API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Database Debug | NAMarket</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Connection Debugger</h1>
          <p className="text-gray-600 mb-4">
            This tool helps diagnose issues with the database connection in production.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Diagnostic'}
            </button>
            
            <button
              onClick={resetConnection}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Connection'}
            </button>
            
            <button
              onClick={verifySchema}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Schema'}
            </button>
            
            <button
              onClick={checkProductsApi}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Products API'}
            </button>
            
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go to Products Page
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-700 font-medium">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {diagnosticResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Diagnostic Result</h2>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px]">
                <pre className="whitespace-pre-wrap break-words text-sm font-mono">
                  {JSON.stringify(diagnosticResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {resetResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Reset Result</h2>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px]">
                <pre className="whitespace-pre-wrap break-words text-sm font-mono">
                  {JSON.stringify(resetResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <h3 className="text-amber-800 font-medium">Tips to Fix Database Connection Issues</h3>
          <ul className="list-disc ml-5 mt-2 text-amber-700">
            <li>Verify that your DATABASE_URL is correctly set in Vercel Environment Variables</li>
            <li>Check if your database server allows connections from Vercel IP addresses</li>
            <li>Ensure your database has proper connection limits and is not overloaded</li>
            <li>Try redeploying your application with a clean build</li>
            <li>Check the logs in Vercel for detailed error information</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 