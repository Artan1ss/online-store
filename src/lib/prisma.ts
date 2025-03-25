import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton Prisma Client instance
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

function createPrismaClient() {
  // Configure the PrismaClient for better handling of connection pools
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection retry logic for better Session Pooler compatibility
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add event handlers for development logging
  if (process.env.NODE_ENV === 'development') {
    // Using any to bypass TypeScript strictness as Prisma types might not be up to date
    (client as any).$on('query', (e: any) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });

    (client as any).$on('error', (e: any) => {
      console.error('Prisma Client error:', e);
    });
  }

  return client;
}

// Helper function to handle connection issues
export async function withPrismaClient<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    // Ensure connection
    try {
      await prisma.$connect();
    } catch (connectError) {
      console.error('Connection error:', connectError);
      // Attempt reconnection
      await prisma.$disconnect();
      await prisma.$connect();
    }

    // Execute operation
    const result = await operation(prisma);
    return result;
  } catch (error) {
    console.error('Prisma operation error:', error);
    throw error;
  }
}

export default prisma; 