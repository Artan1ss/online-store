import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Define proper types for query results
type TimeQueryResult = {
  time: Date;
  database: string;
  user: string;
}

type ConnectionInfoResult = {
  version: string;
  max_connections: string;
  server_ip: string | null;
  server_port: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed, use GET' });
  }

  const prisma = new PrismaClient();

  try {
    // Get server timestamp to verify connection
    const startTime = Date.now();
    const result = await prisma.$queryRaw<TimeQueryResult[]>`SELECT NOW() as time, current_database() as database, current_user as user`;
    const endTime = Date.now();
    
    // Get connection information
    const connectionInfo = await prisma.$queryRaw<ConnectionInfoResult[]>`
      SELECT 
        current_setting('server_version') as version,
        current_setting('max_connections') as max_connections,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `;
    
    // Count total users (basic DB operation test)
    const userCount = await prisma.user.count();
    
    // Extract the first result with optional chaining
    const timeResult = result[0];
    const connInfo = connectionInfo[0];
    
    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      timestamp: new Date().toISOString(),
      responseTime: `${endTime - startTime}ms`,
      serverTime: timeResult?.time,
      database: timeResult?.database,
      dbUser: timeResult?.user,
      connectionInfo: connInfo,
      poolType: process.env.DATABASE_URL?.includes(':6543') ? 'Session Pooler' : 'Direct Connection',
      stats: {
        userCount
      },
      envVars: {
        DATABASE_URL_STARTS_WITH: process.env.DATABASE_URL?.substring(0, 30) + '...',
        DIRECT_URL_STARTS_WITH: process.env.DIRECT_URL?.substring(0, 30) + '...',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Database connection test error:', error);
    
    let errorMessage = 'Unknown error';
    let errorDetails: { name?: string; stack?: string } = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
    
    return res.status(500).json({
      success: false,
      message: 'Connection failed',
      error: errorMessage,
      details: errorDetails,
      envVars: {
        DATABASE_URL_STARTS_WITH: process.env.DATABASE_URL?.substring(0, 30) + '...',
        DIRECT_URL_STARTS_WITH: process.env.DIRECT_URL?.substring(0, 30) + '...',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } finally {
    await prisma.$disconnect();
  }
} 