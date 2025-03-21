import { NextApiRequest, NextApiResponse } from 'next';
import { dbService } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Test connection endpoint called');
  
  try {
    // Use the enhanced test connection method
    const testResult = await dbService.testConnection();
    
    if (testResult.success) {
      // Connection successful - Return 200 with test result
      return res.status(200).json({
        status: 'success',
        message: testResult.message,
        details: testResult.details,
        timestamp: new Date().toISOString()
      });
    } else {
      // Connection failed - Return 500 with error details
      return res.status(500).json({
        status: 'error',
        message: testResult.message,
        error: testResult.error || {},
        details: testResult.details || {},
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    // Unexpected error during the test - Return 500
    console.error('Unexpected error in test connection endpoint:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Unexpected error during connection test',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
} 