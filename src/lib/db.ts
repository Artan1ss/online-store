import { PrismaClient } from '@prisma/client';
import { getVercelDatabaseUrls } from './connection-url';
import { Prisma } from '@prisma/client';

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Determine whether to use logging
const prismaLogLevels: Prisma.LogLevel[] = isProduction 
  ? ['error', 'warn'] 
  : ['query', 'info', 'warn', 'error'];

// Function to get a fixed database URL without double encoding issues
export function getFixedDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.warn('DATABASE_URL environment variable is not set');
    return undefined;
  }
  
  try {
    // Check if URL is already correctly formatted
    if (url.includes('%3A%2F%2F')) {
      // URL is double-encoded, let's fix it
      return decodeURIComponent(url);
    }
    
    // URL looks correctly formatted
    return url;
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error);
    // Return original URL if we can't process it
    return url;
  }
}

// Create a singleton PrismaClient instance
let prisma: PrismaClient;

// Logic to handle retrying database connections with exponential backoff
async function connectWithRetry(client: PrismaClient, maxRetries = 5): Promise<void> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // Attempt to connect
      await client.$connect();
      console.log('Successfully connected to the database');
      return;
    } catch (error) {
      lastError = error as Error;
      retries++;
      const delay = Math.min(Math.pow(2, retries) * 1000, 10000); // Exponential backoff, max 10s
      
      console.error(
        `Database connection attempt ${retries} failed. Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : String(error)
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries have failed
  console.error(`Failed to connect to database after ${maxRetries} attempts`);
  throw lastError;
}

if (process.env.NODE_ENV === 'production') {
  // In production, use the optimized connection URLs
  const { databaseUrl, directUrl } = getVercelDatabaseUrls();
  
  console.log(`Using optimized database connection for production environment`);
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: prismaLogLevels,
  });
  
  // Log connection details (without showing credentials)
  const dbUrlSafe = databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//USER:PASSWORD@');
  console.log(`Database connection configured with optimized URL: ${dbUrlSafe}`);
  
  if (directUrl) {
    const directUrlSafe = directUrl.replace(/\/\/[^:]+:[^@]+@/, '//USER:PASSWORD@');
    console.log(`Direct URL available: ${directUrlSafe}`);
  }
} else {
  // In development, use the standard environment variable with fixing
  const fixedUrl = getFixedDatabaseUrl();
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: fixedUrl,
      },
    },
    log: prismaLogLevels,
  });
  
  if (fixedUrl) {
    const dbUrlSafe = fixedUrl.replace(/\/\/[^:]+:[^@]+@/, '//USER:PASSWORD@');
    console.log(`Development database connection configured: ${dbUrlSafe}`);
  }
}

// Handle connection on initialization with retry logic
connectWithRetry(prisma).catch(error => {
  console.error('Failed to initialize database connection', error);
});

// Export the client instance
export { prisma };

// Enhanced error handling operation execution function
export async function executePrismaOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`Prisma error: ${errorMessage}`, error);
    
    // Detailed logging for debugging purposes
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Build detailed error message
    let detailedError = errorMessage;
    
    if (error.code) {
      detailedError += ` (${error.code})`;
    }
    
    if (process.env.NODE_ENV === 'development' && error.message) {
      detailedError += `: ${error.message}`;
    }
    
    throw new Error(detailedError);
  }
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma; 