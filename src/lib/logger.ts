// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Logger configuration
const LOG_CONFIG = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  includeStack: process.env.NODE_ENV !== 'production',
} as const;

// Logger class
class Logger {
  private context: string;
  private requestId?: string;
  private userId?: string;

  constructor(context: string, requestId?: string, userId?: string) {
    this.context = context;
    this.requestId = requestId;
    this.userId = userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= LOG_CONFIG.level;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.context}] ${message}`,
    };

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (this.userId) {
      entry.userId = this.userId;
    }

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: LOG_CONFIG.includeStack ? error.stack : undefined,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, metadata, error);
    const logString = JSON.stringify(entry);

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
        console.error(logString);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  // Create a child logger with additional context
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.requestId, this.userId);
  }

  // Create a logger for a specific request
  static forRequest(context: string, requestId: string, userId?: string): Logger {
    return new Logger(context, requestId, userId);
  }

  // Create a logger for a specific user
  static forUser(context: string, userId: string): Logger {
    return new Logger(context, undefined, userId);
  }
}

// Default logger instances
export const logger = new Logger('APP');
export const apiLogger = new Logger('API');
export const dbLogger = new Logger('DB');
export const storageLogger = new Logger('STORAGE');

// Helper functions
export function createLogger(context: string, requestId?: string, userId?: string): Logger {
  return new Logger(context, requestId, userId);
}

export function logRequest(req: any, res: any, next?: () => void): void {
  const requestId = req.headers['x-request-id'] || req.headers['x-vercel-id'] || `req-${Date.now()}`;
  const startTime = Date.now();
  
  req.logger = Logger.forRequest('REQUEST', requestId);
  req.requestId = requestId;

  req.logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
  });

  if (next) {
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      req.logger.info('Request completed', {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}

// Performance logging
export function logPerformance(operation: string, startTime: number, metadata?: Record<string, any>): void {
  const duration = Date.now() - startTime;
  
  if (duration > 1000) {
    logger.warn('Slow operation detected', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  } else {
    logger.debug('Operation completed', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  }
}

// Error logging with context
export function logError(error: Error, context?: string, metadata?: Record<string, any>): void {
  const logContext = context ? `ERROR:${context}` : 'ERROR';
  const errorLogger = new Logger(logContext);
  
  errorLogger.error('Unhandled error occurred', error, {
    errorType: error.constructor.name,
    ...metadata,
  });
}

// API response logging
export function logApiResponse(
  requestId: string,
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  error?: Error
): void {
  const logLevel = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
  const logger = Logger.forRequest('API', requestId);
  
  const message = error ? 'API request failed' : 'API request completed';
  const metadata = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  };

  if (error) {
    logger.error(message, error, metadata);
  } else {
    logger.info(message, metadata);
  }
}

export default Logger;
