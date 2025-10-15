import { NextApiResponse } from 'next';

// API Result type for consistent responses
export type ApiResult<T = any> = 
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code?: number; details?: any };

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Helper functions for API responses
export function ok<T>(data: T, message?: string): ApiResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, code?: number, details?: any): ApiResult<never> {
  return { ok: false, error, code, details };
}

// Next.js API response helpers
export function sendApiResult<T>(res: NextApiResponse, result: ApiResult<T>, statusCode?: number): void {
  const defaultStatus = result.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const status = statusCode || (result.ok ? defaultStatus : (result.code || defaultStatus));
  
  res.status(status).json(result);
}

export function sendOk<T>(res: NextApiResponse, data: T, message?: string, statusCode = HTTP_STATUS.OK): void {
  sendApiResult(res, ok(data, message), statusCode);
}

export function sendFail(res: NextApiResponse, error: string, code = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: any): void {
  sendApiResult(res, fail(error, code, details), code);
}

// Error handling wrapper for API routes
export function withApiErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<void>
) {
  return async (...args: T): Promise<void> => {
    try {
      await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      const res = args[1] as NextApiResponse;
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      sendFail(res, errorMessage, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };
}

// Validation error formatter
export function formatValidationError(error: any): string {
  if (error?.issues) {
    return error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  }
  return error?.message || 'Validation failed';
}

// Request ID helper (for logging)
export function getRequestId(req: any): string {
  return req.headers['x-request-id'] || 
         req.headers['x-vercel-id'] || 
         `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// CORS helper
export function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Cache control helpers
export function setCacheHeaders(res: NextApiResponse, maxAge = 60): void {
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}`);
}

export function setNoCacheHeaders(res: NextApiResponse): void {
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
}

// ETag helper for caching
export function generateETag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

export function handleETag(req: any, res: NextApiResponse, data: any): boolean {
  const etag = generateETag(data);
  res.setHeader('ETag', etag);
  
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === etag) {
    res.status(304).end();
    return true; // Client has cached version
  }
  
  return false; // Need to send data
}
