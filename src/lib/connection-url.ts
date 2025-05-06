/**
 * Utility functions to handle database connection URLs
 * Specifically designed to handle issues with Vercel and Supabase
 */

/**
 * Generates a connection string for Supabase that works with Vercel
 * Handles encoding issues and adds connection pool settings
 */
export function generateConnectionUrl(databaseUrl?: string): string | undefined {
  // Use provided URL or environment variable
  const url = databaseUrl || process.env.DATABASE_URL;
  
  if (!url) {
    console.error('DATABASE_URL not provided or not found in environment variables');
    return undefined;
  }
  
  try {
    // Parse URL to ensure it's properly formatted
    const parsedUrl = new URL(url);
    
    // Extract components
    const protocol = parsedUrl.protocol;
    const username = parsedUrl.username;
    const password = encodeURIComponent(parsedUrl.password); // Ensure password is properly encoded
    const host = parsedUrl.host;
    const pathname = parsedUrl.pathname;
    
    // Create query parameters for connection pooling
    // These parameters are optimized for Vercel+Supabase deployment
    const connectionParams = new URLSearchParams({
      pgbouncer: 'true',          // Use PgBouncer
      'connection_limit': '1',    // Limit connections per serverless function
      'pool_timeout': '30',       // Increased connection timeout in seconds
      'statement_timeout': '60000', // Maximum time (ms) statements can run (1 min)
      'idle_timeout': '60',       // Maximum idle time (sec) for connections
      sslmode: 'require',         // Require SSL
      'connect_timeout': '10'     // Connection timeout in seconds
    });
    
    // Include application name for better monitoring in database logs
    if (process.env.APP_NAME) {
      connectionParams.append('application_name', process.env.APP_NAME);
    } else {
      connectionParams.append('application_name', 'online-store-app');
    }
    
    // Build enhanced connection string
    const enhancedUrl = `${protocol}//${username}:${password}@${host}${pathname}?${connectionParams.toString()}`;
    
    // Log success (without exposing credentials)
    console.log('Generated enhanced database connection URL with optimized pooling');
    return enhancedUrl;
  } catch (error) {
    console.error('Error generating connection URL:', error instanceof Error ? error.message : String(error));
    
    // Fall back to original URL if parsing fails
    return url;
  }
}

/**
 * Gets database URL optimized for Vercel deployment
 */
export function getVercelDatabaseUrls(): { 
  databaseUrl: string | undefined;
} {
  // Generate optimized connection URL
  const primaryUrl = generateConnectionUrl(process.env.DATABASE_URL);
  
  return {
    databaseUrl: primaryUrl
  };
} 