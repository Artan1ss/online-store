import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  // Map error codes to more user-friendly messages
  const errorMessages: Record<string, string> = {
    'CredentialsSignin': 'The email or password you entered is incorrect. Please try again.',
    'SessionRequired': 'You need to be signed in to access this page.',
    'AccessDenied': 'You do not have permission to access this page.',
    'Default': 'An authentication error occurred. Please try again.'
  };

  // Get the error message based on the error code
  const errorMessage = error 
    ? (errorMessages[error as string] || `Error: ${error}`) 
    : errorMessages.Default;

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <Head>
        <title>Authentication Error</title>
      </Head>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-red-600 p-4">
          <h1 className="text-xl font-bold text-white">Authentication Error</h1>
        </div>
        
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{errorMessage}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="font-medium mb-2">What would you like to do?</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Try logging in again
                  </Link>
                </li>
                <li>
                  <Link href="/debug/admin-login" className="text-blue-600 hover:underline">
                    Go to admin debug page
                  </Link>
                </li>
                <li>
                  <Link href="/debug/admin-bypass" className="text-blue-600 hover:underline">
                    Try admin bypass
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-blue-600 hover:underline">
                    Return to home page
                  </Link>
                </li>
              </ul>
            </div>
            
            {error === 'CredentialsSignin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Tips:</h3>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  <li>Check that you've entered the correct email address</li>
                  <li>Verify that your password is correct (case sensitive)</li>
                  <li>If you're an admin user, make sure your account has been created</li>
                  <li>If problems persist, try the admin debug or bypass options</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 