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
    // These parameters help with Vercel's serverless functions
    const connectionParams = new URLSearchParams({
      pgbouncer: 'true',          // Use PgBouncer
      'connection_limit': '1',    // Limit connections per serverless function
      'pool_timeout': '20',       // Connection timeout in seconds
      sslmode: 'require'          // Require SSL
    });
    
    // Build enhanced connection string
    const enhancedUrl = `${protocol}//${username}:${password}@${host}${pathname}?${connectionParams.toString()}`;
    
    // Log success (without exposing credentials)
    console.log('Generated enhanced database connection URL');
    return enhancedUrl;
  } catch (error) {
    console.error('Error generating connection URL:', error);
    
    // Fall back to original URL if parsing fails
    return url;
  }
}

/**
 * Gets database URLs optimized for Vercel deployment
 */
export function getVercelDatabaseUrls(): { 
  databaseUrl: string | undefined; 
  directUrl: string | undefined 
} {
  const primaryUrl = generateConnectionUrl(process.env.DATABASE_URL);
  const directUrl = process.env.DIRECT_URL || primaryUrl; // Use DIRECT_URL if available
  
  return {
    databaseUrl: primaryUrl,
    directUrl: directUrl
  };
} 