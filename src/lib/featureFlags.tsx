import React from 'react';
import { env } from './env';

// Feature flag definitions
export interface FeatureFlags {
  // UI Features
  NEW_MENU_DESIGN: boolean;
  ADVANCED_FILTERS: boolean;
  DARK_MODE: boolean;
  
  // Admin Features
  BULK_OPERATIONS: boolean;
  ANALYTICS_DASHBOARD: boolean;
  ADVANCED_EDITING: boolean;
  
  // Experimental Features
  SMART_RECOMMENDATIONS: boolean;
  REAL_TIME_UPDATES: boolean;
  OFFLINE_MODE: boolean;
  
  // Performance Features
  IMAGE_OPTIMIZATION: boolean;
  LAZY_LOADING: boolean;
  PREFETCHING: boolean;
}

// Default feature flags (conservative - most features OFF in production)
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // UI Features
  NEW_MENU_DESIGN: false,
  ADVANCED_FILTERS: false,
  DARK_MODE: false,
  
  // Admin Features
  BULK_OPERATIONS: true, // This is working well, keep enabled
  ANALYTICS_DASHBOARD: false,
  ADVANCED_EDITING: true, // Core functionality, keep enabled
  
  // Experimental Features
  SMART_RECOMMENDATIONS: false,
  REAL_TIME_UPDATES: false,
  OFFLINE_MODE: false,
  
  // Performance Features
  IMAGE_OPTIMIZATION: true, // Safe to enable
  LAZY_LOADING: true, // Safe to enable
  PREFETCHING: false,
};

// Parse feature flags from environment variables
function parseFeatureFlags(): FeatureFlags {
  const flags = { ...DEFAULT_FEATURE_FLAGS };
  
  // Parse NEXT_PUBLIC_FEATURE_* environment variables
  Object.keys(flags).forEach((flagName) => {
    const envKey = `NEXT_PUBLIC_FEATURE_${flagName}`;
    const envValue = process.env[envKey];
    
    if (envValue !== undefined) {
      flags[flagName as keyof FeatureFlags] = envValue.toLowerCase() === 'true';
    }
  });
  
  return flags;
}

// Singleton feature flags instance
let featureFlags: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!featureFlags) {
    featureFlags = parseFeatureFlags();
    
    // Log feature flags in development
    if (env.NODE_ENV === 'development') {
      console.log('🚩 Feature Flags:', featureFlags);
    }
  }
  
  return featureFlags;
}

// Individual feature flag getters
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flagName];
}

// React hook for feature flags
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  // In a real app, you might want to make this reactive
  // For now, it's static based on environment variables
  return isFeatureEnabled(flagName);
}

// Feature flag components
export function FeatureGate({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: keyof FeatureFlags; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

// Conditional feature rendering
export function withFeatureFlag<T extends object>(
  Component: React.ComponentType<T>,
  flagName: keyof FeatureFlags,
  fallback?: React.ComponentType<T>
) {
  return function FeatureFlaggedComponent(props: T) {
    const isEnabled = useFeatureFlag(flagName);
    
    if (isEnabled) {
      return <Component {...props} />;
    }
    
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

// Development helpers
export function getAllFeatureFlags(): Record<string, boolean> {
  return getFeatureFlags() as unknown as Record<string, boolean>;
}

export function getEnabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}

export function getDisabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => !enabled)
    .map(([name]) => name);
}

// Environment-specific overrides
export function getEnvironmentFeatureFlags(): Partial<FeatureFlags> {
  const overrides: Partial<FeatureFlags> = {};
  
  if (env.NODE_ENV === 'development') {
    // Enable more features in development
    overrides.NEW_MENU_DESIGN = true;
    overrides.ADVANCED_FILTERS = true;
    overrides.ANALYTICS_DASHBOARD = true;
  }
  
  if (env.NODE_ENV === 'test') {
    // Minimal features for testing
    overrides.BULK_OPERATIONS = false;
    overrides.ADVANCED_EDITING = false;
    overrides.IMAGE_OPTIMIZATION = false;
  }
  
  return overrides;
}

// Feature flag validation
export function validateFeatureFlags(): { valid: boolean; errors: string[] } {
  const flags = getFeatureFlags();
  const errors: string[] = [];
  
  // Check for conflicting flags
  if (flags.OFFLINE_MODE && flags.REAL_TIME_UPDATES) {
    errors.push('OFFLINE_MODE and REAL_TIME_UPDATES cannot both be enabled');
  }
  
  if (flags.SMART_RECOMMENDATIONS && !flags.ANALYTICS_DASHBOARD) {
    errors.push('SMART_RECOMMENDATIONS requires ANALYTICS_DASHBOARD to be enabled');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Initialize feature flags with validation
const validation = validateFeatureFlags();
if (!validation.valid) {
  console.warn('⚠️ Feature flag validation failed:', validation.errors);
}

const FeatureFlags = {
  getFeatureFlags,
  isFeatureEnabled,
  useFeatureFlag,
  FeatureGate,
  withFeatureFlag,
  getAllFeatureFlags,
  getEnabledFeatures,
  getDisabledFeatures,
  getEnvironmentFeatureFlags,
  validateFeatureFlags,
};

export default FeatureFlags;
