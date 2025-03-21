import { PrismaClient } from '@prisma/client';

// For global variable declaration, supports hot reload
declare global {
  var prismaInstance: PrismaClient | undefined;
}

// Fix potential URL encoding issues
function getFixedDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('DATABASE_URL environment variable is missing');
    return undefined;
  }
  
  // Handle potential URL encoding issues
  try {
    // Check if the URL contains percent encoding that needs to be fixed
    if (url.includes('%')) {
      return decodeURIComponent(url);
    }
    
    // Check for double encoding
    if (url.includes('postgres%3A')) {
      return decodeURIComponent(url);
    }
    
    return url;
  } catch (e) {
    console.error('Error decoding DATABASE_URL:', e);
    return url; // Return original URL if decoding fails
  }
}

// Create Prisma client class with enhanced error handling
class PrismaService {
  private static instance: PrismaService;
  private _client: PrismaClient;
  private _isConnected: boolean = false;
  private _connectionAttempts: number = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 3;

  private constructor() {
    // Check if a global instance already exists
    if (global.prismaInstance) {
      this._client = global.prismaInstance;
      console.log('Using existing Prisma instance');
    } else {
      // Get fixed database URL to avoid encoding issues
      const fixedDatabaseUrl = getFixedDatabaseUrl();
      
      // Configure Prisma client with proper logging
      this._client = new PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
          db: {
            url: fixedDatabaseUrl,
          },
        }
      });
      
      if (process.env.NODE_ENV !== 'production') {
        // Cache connection in development environment
        global.prismaInstance = this._client;
      }
      
      console.log('Creating new Prisma instance');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Database URL present:', !!process.env.DATABASE_URL);
      console.log('Database URL length:', process.env.DATABASE_URL?.length ?? 'undefined');
    }

    // Connect to database
    this.connect();
  }

  // Get instance using singleton pattern
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  // Get client
  public get prisma(): PrismaClient {
    return this._client;
  }

  // Connect to database
  private async connect() {
    try {
      if (!this._isConnected && this._connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        this._connectionAttempts++;
        console.log(`Attempting database connection (${this._connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})...`);
        
        // Try a simple query to test the connection
        await this._client.$queryRaw`SELECT 1 as connected`;
        
        this._isConnected = true;
        this._connectionAttempts = 0;
        
        console.log('Successfully connected to database');
      }
    } catch (error: any) {
      console.error('Database connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      
      // Try to reconnect
      if (this._connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        console.log(`Attempting to reconnect (${this._connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})...`);
        
        // Retry after a short delay with exponential backoff
        setTimeout(() => this.connect(), 1000 * Math.pow(2, this._connectionAttempts));
      } else {
        console.error('Maximum retry attempts reached, cannot connect to database');
      }
    }
  }

  // Test database connection explicitly
  public async testConnection() {
    try {
      // Force a new connection attempt
      console.log('Testing database connection explicitly...');
      
      // Try a simple query to test the connection
      const result = await this._client.$queryRaw`SELECT 1 as connected`;
      
      // Check response
      if (Array.isArray(result) && result.length > 0 && result[0].connected === 1) {
        this._isConnected = true;
        console.log('Test connection successful');
        return {
          success: true,
          message: 'Database connection test successful',
          details: {
            databaseUrl: process.env.DATABASE_URL ? 
              `${process.env.DATABASE_URL.substring(0, 15)}...` : 
              'Not available',
            environment: process.env.NODE_ENV || 'unknown'
          }
        };
      } else {
        this._isConnected = false;
        console.error('Test connection returned unexpected result:', result);
        return {
          success: false,
          message: 'Database connection test returned unexpected result',
          details: { result }
        };
      }
    } catch (error: any) {
      this._isConnected = false;
      console.error('Test connection failed:', error);
      
      // Return structured error information
      return {
        success: false,
        message: 'Database connection test failed',
        error: {
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      };
    }
  }

  // Gracefully disconnect
  public async disconnect() {
    if (this._isConnected) {
      await this._client.$disconnect();
      this._isConnected = false;
      console.log('Database connection closed');
    }
  }
}

// Get Prisma instance
const prismaService = PrismaService.getInstance();
export const prisma = prismaService.prisma;

// Export the service for testing purposes
export const dbService = prismaService;

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
  await prismaService.disconnect();
});

export default prisma; 