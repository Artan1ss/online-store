import { PrismaClient } from '@prisma/client';

// For global variable declaration, supports hot reload
declare global {
  var prismaInstance: PrismaClient | undefined;
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
      this._client = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
      
      if (process.env.NODE_ENV !== 'production') {
        // Cache connection in development environment
        global.prismaInstance = this._client;
      }
      
      console.log('Creating new Prisma instance');
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
        
        // Try a simple query to test the connection
        await this._client.$queryRaw`SELECT 1 as connected`;
        
        this._isConnected = true;
        this._connectionAttempts = 0;
        
        console.log('Successfully connected to database');
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      
      // Try to reconnect
      if (this._connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        console.log(`Attempting to reconnect (${this._connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})...`);
        
        // Retry after a short delay
        setTimeout(() => this.connect(), 1000 * this._connectionAttempts);
      } else {
        console.error('Maximum retry attempts reached, cannot connect to database');
      }
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

// Enhanced error handling operation execution function
export async function executePrismaOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`Prisma error: ${errorMessage}`, error);
    
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