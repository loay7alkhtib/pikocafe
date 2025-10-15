import { NextApiRequest, NextApiResponse } from 'next';
import { sendOk, sendFail, getRequestId, HTTP_STATUS } from '../../src/lib/http';
import { getServerDatabaseService } from '../../src/lib/supabase';
import { storageService } from '../../src/lib/storage';
import { env } from '../../src/lib/env';
import { createLogger } from '../../src/lib/logger';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    database: { status: 'healthy' | 'unhealthy'; error?: string; responseTime?: number };
    storage: { status: 'healthy' | 'unhealthy'; error?: string; responseTime?: number };
  };
  environment: string;
  uptime: number;
}

async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const db = getServerDatabaseService();
    
    // Simple query to check database connectivity
    await db.getCategories();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
      responseTime,
    };
  }
}

async function checkStorage(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const result = await storageService.healthCheck();
    const responseTime = Date.now() - startTime;
    
    if (result.healthy) {
      return {
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        status: 'unhealthy',
        error: result.error,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown storage error',
      responseTime,
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const requestId = getRequestId(req);
  const logger = createLogger('HEALTH', requestId);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    sendFail(res, 'Method not allowed', 405);
    return;
  }

  const startTime = Date.now();
  
  try {
    logger.info('Health check started');

    // Run all checks in parallel
    const [databaseCheck, storageCheck] = await Promise.all([
      checkDatabase(),
      checkStorage(),
    ]);

    const overallStatus = databaseCheck.status === 'healthy' && storageCheck.status === 'healthy' 
      ? 'healthy' 
      : 'unhealthy';

    const result: HealthCheckResult = {
      status: overallStatus,
      version: env.NEXT_PUBLIC_APP_VERSION,
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseCheck,
        storage: storageCheck,
      },
      environment: env.NODE_ENV,
      uptime: process.uptime(),
    };

    const duration = Date.now() - startTime;
    
    if (overallStatus === 'healthy') {
      logger.info('Health check completed successfully', {
        duration: `${duration}ms`,
        databaseResponseTime: `${databaseCheck.responseTime}ms`,
        storageResponseTime: `${storageCheck.responseTime}ms`,
      });
      
      // Return 200 for healthy status
      res.status(200).json(result);
    } else {
      logger.warn('Health check failed', {
        duration: `${duration}ms`,
        databaseStatus: databaseCheck.status,
        storageStatus: storageCheck.status,
        databaseError: databaseCheck.error,
        storageError: storageCheck.error,
      });
      
      // Return 503 for unhealthy status
      res.status(503).json(result);
    }

    // Set cache headers to prevent caching of health checks
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Health check failed with exception', error as Error, {
      duration: `${duration}ms`,
    });

    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      version: env.NEXT_PUBLIC_APP_VERSION,
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'unhealthy', error: 'Health check exception' },
        storage: { status: 'unhealthy', error: 'Health check exception' },
      },
      environment: env.NODE_ENV,
      uptime: process.uptime(),
    };

    res.status(503).json(errorResult);
  }
}
