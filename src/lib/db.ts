import { PrismaClient } from '@prisma/client';
import { getVercelDatabaseUrls } from './connection-url';
import { Prisma } from '@prisma/client';

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Enhanced logging strategy
const prismaLogLevels: Prisma.LogLevel[] = isProduction 
  ? ['error', 'warn'] 
  : ['query', 'info', 'warn', 'error'];

// Connection status tracking
let connectionStatus = {
  isConnected: false,
  lastError: null as Error | null,
  lastConnectionAttempt: null as Date | null,
  reconnectionAttempts: 0
};

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

// Create a singleton PrismaClient instance with connection handling
let prisma: PrismaClient;

// Logic to handle retrying database connections with exponential backoff
async function connectWithRetry(client: PrismaClient, maxRetries = 5): Promise<void> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // Update connection status
      connectionStatus.lastConnectionAttempt = new Date();
      connectionStatus.reconnectionAttempts = retries;

      // Attempt to connect
      await client.$connect();
      
      // Update connection status on success
      connectionStatus.isConnected = true;
      connectionStatus.lastError = null;
      console.log(`Successfully connected to the database (attempt ${retries + 1})`);
      
      // Validate connection with a simple query
      await client.$queryRaw`SELECT 1 as connection_test`;
      console.log('Database connection validated with test query');
      
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      connectionStatus.lastError = lastError;
      connectionStatus.isConnected = false;
      
      retries++;
      // Exponential backoff with jitter to prevent connection stampedes
      const baseDelay = Math.min(Math.pow(2, retries) * 1000, 10000);
      const jitter = Math.floor(Math.random() * 500); // Add up to 500ms of random jitter
      const delay = baseDelay + jitter;
      
      console.error(
        `Database connection attempt ${retries} failed. Retrying in ${delay}ms...`,
        lastError.message
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries have failed
  connectionStatus.isConnected = false;
  console.error(`Failed to connect to database after ${maxRetries} attempts`);
  throw lastError;
}

// Configure client based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, use the optimized connection URL
  const { databaseUrl } = getVercelDatabaseUrls();
  
  if (!databaseUrl) {
    console.error('Critical Error: No database URL available for production environment');
    // In production, we might want to throw an error or exit the process
    if (process.env.STRICT_DB_CONNECTION === 'true') {
      throw new Error('No database URL available for production environment');
    }
  }
  
  console.log(`Using optimized database connection for production environment`);
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: prismaLogLevels,
    // Add error formatting for better diagnostics
    errorFormat: 'pretty'
  });
  
  // Log connection details (without showing credentials)
  if (databaseUrl) {
    const dbUrlSafe = databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//USER:PASSWORD@');
    console.log(`Database connection configured with optimized URL: ${dbUrlSafe}`);
  } else {
    console.warn('Database URL is undefined in production environment');
  }
} else {
  // In development, use the standard environment variable with fixing
  const fixedUrl = getFixedDatabaseUrl();
  
  if (!fixedUrl) {
    console.warn('No DATABASE_URL found in development environment');
  }
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: fixedUrl,
      },
    },
    log: prismaLogLevels,
    // Add error formatting for better diagnostics
    errorFormat: 'pretty'
  });
  
  if (fixedUrl) {
    const dbUrlSafe = fixedUrl.replace(/\/\/[^:]+:[^@]+@/, '//USER:PASSWORD@');
    console.log(`Development database connection configured: ${dbUrlSafe}`);
  }
}

// Handle connection on initialization with retry logic
connectWithRetry(prisma).catch(error => {
  console.error('Failed to initialize database connection', error);
  connectionStatus.isConnected = false;
  connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
});

// Export the client instance
export { prisma };

// Enhanced error handling operation execution function with timeouts
export async function executePrismaOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Database operation failed',
  options = { timeout: 30000, retries: 1 }
): Promise<T> {
  let lastError: Error | null = null;
  let attempts = 0;
  
  // Add timeout functionality
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    // Create a promise that rejects in specified milliseconds
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Prisma operation timed out after ${ms}ms`));
      }, ms);
    });
    
    // Returns a race between the timeout and the passed promise
    return Promise.race([promise, timeout]) as Promise<T>;
  };
  
  while (attempts <= options.retries) {
    try {
      // Execute operation with timeout
      return await withTimeout(operation(), options.timeout);
    } catch (error: any) {
      lastError = error;
      attempts++;
      
      console.error(`Prisma error (attempt ${attempts}/${options.retries + 1}): ${errorMessage}`, {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Check if this is a connection error that requires reconnection
      if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017') {
        console.warn('Connection error detected, attempting to reconnect...');
        
        try {
          // Attempt to reconnect
          connectionStatus.isConnected = false;
          await connectWithRetry(prisma, 3);
        } catch (reconnectError) {
          console.error('Failed to reconnect to database', reconnectError);
        }
      }
      
      // If we have retries left, add a small delay before retrying
      if (attempts <= options.retries) {
        const delay = Math.min(Math.pow(2, attempts) * 100, 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying operation, attempt ${attempts + 1}/${options.retries + 1}`);
      }
    }
  }
  
  // Build detailed error message
  let detailedError = errorMessage;
  
  if (lastError) {
    if (lastError.name === 'PrismaClientKnownRequestError' && 'code' in lastError) {
      detailedError += ` (${(lastError as any).code})`;
    }
    
    if (process.env.NODE_ENV === 'development' && lastError.message) {
      detailedError += `: ${lastError.message}`;
    }
  }
  
  throw new Error(detailedError);
}

// Public method to check connection status
export function getDatabaseConnectionStatus() {
  return {
    ...connectionStatus,
    timestamp: new Date().toISOString()
  };
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  if (connectionStatus.isConnected) {
    console.log('Disconnecting database before exit');
    await prisma.$disconnect();
    connectionStatus.isConnected = false;
  }
});

// Database service for common operations
export const dbService = {
  async testConnection() {
    try {
      // Try a simple query to check if the database is reachable
      await prisma.$queryRaw`SELECT 1 as connected`;
      
      // Get database metadata
      const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      const productCount = await prisma.product.count().catch(() => 'N/A');
      const orderCount = await prisma.order.count().catch(() => 'N/A');
      const userCount = await prisma.user.count().catch(() => 'N/A');
      
      // Update connection status
      connectionStatus.isConnected = true;
      connectionStatus.lastError = null;
      
      return {
        success: true,
        message: 'Successfully connected to database',
        details: {
          tables: Array.isArray(tables) ? tables.length : 0,
          tableList: tables,
          counts: {
            products: productCount,
            orders: orderCount, 
            users: userCount
          },
          environment: process.env.NODE_ENV,
          connectionStatus: getDatabaseConnectionStatus(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      
      // Update connection status
      connectionStatus.isConnected = false;
      connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
      
      return {
        success: false,
        message: 'Failed to connect to database',
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        details: {
          environment: process.env.NODE_ENV,
          connectionStatus: getDatabaseConnectionStatus(),
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  async healthCheck() {
    try {
      // Quick connection check
      await prisma.$queryRaw`SELECT 1 as health_check`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default prisma; 