import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional().default('https://example.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required').optional().default('example-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  
  // Optional monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // App version (defaults to timestamp)
  NEXT_PUBLIC_APP_VERSION: z.string().default(() => {
    return new Date().toISOString().slice(0, 10);
  }),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
const parseResult = envSchema.safeParse(process.env);

let env: z.infer<typeof envSchema>;

if (!parseResult.success) {
  console.error('❌ Environment validation failed:');
  console.error(parseResult.error.flatten().fieldErrors);
  
  // In development, use defaults instead of throwing
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Using default values for missing environment variables in development');
    // Use default values for development
    const defaultEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'example-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SENTRY_DSN: undefined,
      NEXT_PUBLIC_APP_VERSION: new Date().toISOString().slice(0, 10),
      NODE_ENV: 'development' as const,
    };
    
    // Override with any valid env vars
    Object.keys(parseResult.error.flatten().fieldErrors).forEach(key => {
      if (process.env[key]) {
        (defaultEnv as any)[key] = process.env[key];
      }
    });
    
    // Re-parse with defaults
    const fallbackResult = envSchema.safeParse(defaultEnv);
    if (fallbackResult.success) {
      env = fallbackResult.data;
    } else {
      throw new Error('Invalid environment configuration even with defaults');
    }
  } else {
    throw new Error('Invalid environment configuration');
  }
} else {
  env = parseResult.data;
}

export { env };

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Supabase configuration helpers
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Log environment status (without sensitive data)
if (isDevelopment) {
  console.log('🔧 Environment loaded:', {
    nodeEnv: env.NODE_ENV,
    appVersion: env.NEXT_PUBLIC_APP_VERSION,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
    hasSentryDsn: !!env.SENTRY_DSN,
  });
}
