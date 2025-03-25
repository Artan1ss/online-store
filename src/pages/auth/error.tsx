import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('An authentication error occurred');

  useEffect(() => {
    const { error } = router.query;
    
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          setErrorMessage('Login failed: Your email or password is incorrect');
          break;
        case 'AccessDenied':
          setErrorMessage('Access denied: You do not have permission to access this page');
          break;
        case 'SessionRequired':
          setErrorMessage('You need to be logged in to access this page');
          break;
        case 'DatabaseConnectionError':
          setErrorMessage('Database connection error: Unable to connect to the database');
          break;
        default:
          setErrorMessage(`Authentication error: ${error}`);
      }
    }
  }, [router.query]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Auth Error - NAMarket</title>
        <meta name="description" content="Authentication error page" />
      </Head>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We encountered a problem with your authentication
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-3">What would you like to do?</h3>
          
          <ul className="space-y-3">
            <li>
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Try logging in again
              </Link>
            </li>
            <li>
              <Link
                href="/debug/admin-login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Go to admin debug page
              </Link>
            </li>
            <li>
              <Link
                href="/debug/admin-bypass"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Try admin bypass
              </Link>
            </li>
            <li>
              <Link
                href="/debug/emergency-admin"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Use Emergency Admin Access
              </Link>
            </li>
            <li>
              <Link
                href="/debug/super-admin"
                className="text-red-600 hover:text-red-800 font-bold"
              >
                Use Super Admin (Cookie Bypass)
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Return to home page
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 