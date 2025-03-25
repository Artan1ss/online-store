import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed, use GET' });
  }

  const prisma = new PrismaClient();
  let client: any = null;

  try {
    // Get server timestamp to verify connection
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT NOW() as time, current_database() as database, current_user as user`;
    const endTime = Date.now();
    
    // Get connection information
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        current_setting('server_version') as version,
        current_setting('max_connections') as max_connections,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `;
    
    // Count total users (basic DB operation test)
    const userCount = await prisma.user.count();
    
    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      timestamp: new Date().toISOString(),
      responseTime: `${endTime - startTime}ms`,
      serverTime: result[0]?.time,
      database: result[0]?.database,
      dbUser: result[0]?.user,
      connectionInfo: connectionInfo[0],
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
    let errorDetails = {};
    
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