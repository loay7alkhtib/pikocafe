import { 
  getFeatureFlags, 
  isFeatureEnabled, 
  getEnabledFeatures, 
  getDisabledFeatures,
  validateFeatureFlags,
  FeatureFlags 
} from '../src/lib/featureFlags';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Feature Flags', () => {
  describe('getFeatureFlags', () => {
    it('should return default feature flags when no env vars are set', () => {
      const flags = getFeatureFlags();
      
      expect(flags).toBeDefined();
      expect(typeof flags.NEW_MENU_DESIGN).toBe('boolean');
      expect(typeof flags.BULK_OPERATIONS).toBe('boolean');
      expect(typeof flags.SMART_RECOMMENDATIONS).toBe('boolean');
    });

    it('should override defaults with environment variables', () => {
      process.env.NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN = 'true';
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'true';
      
      const flags = getFeatureFlags();
      
      expect(flags.NEW_MENU_DESIGN).toBe(true);
      expect(flags.SMART_RECOMMENDATIONS).toBe(true);
    });

    it('should handle case-insensitive boolean values', () => {
      process.env.NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN = 'TRUE';
      process.env.NEXT_PUBLIC_FEATURE_ADVANCED_FILTERS = 'False';
      
      const flags = getFeatureFlags();
      
      expect(flags.NEW_MENU_DESIGN).toBe(true);
      expect(flags.ADVANCED_FILTERS).toBe(false);
    });

    it('should return same instance on multiple calls (singleton)', () => {
      const flags1 = getFeatureFlags();
      const flags2 = getFeatureFlags();
      
      expect(flags1).toBe(flags2);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return correct boolean value for feature', () => {
      process.env.NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN = 'true';
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'false';
      
      expect(isFeatureEnabled('NEW_MENU_DESIGN')).toBe(true);
      expect(isFeatureEnabled('SMART_RECOMMENDATIONS')).toBe(false);
    });

    it('should handle non-existent features gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(() => isFeatureEnabled('NON_EXISTENT_FEATURE' as any)).toThrow();
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return array of enabled feature names', () => {
      process.env.NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN = 'true';
      process.env.NEXT_PUBLIC_FEATURE_BULK_OPERATIONS = 'true';
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'false';
      
      const enabled = getEnabledFeatures();
      
      expect(enabled).toContain('NEW_MENU_DESIGN');
      expect(enabled).toContain('BULK_OPERATIONS');
      expect(enabled).not.toContain('SMART_RECOMMENDATIONS');
    });

    it('should return empty array when no features are enabled', () => {
      // Set all features to false
      Object.keys(getFeatureFlags()).forEach(key => {
        process.env[`NEXT_PUBLIC_FEATURE_${key}`] = 'false';
      });
      
      const enabled = getEnabledFeatures();
      expect(enabled).toEqual([]);
    });
  });

  describe('getDisabledFeatures', () => {
    it('should return array of disabled feature names', () => {
      process.env.NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN = 'true';
      process.env.NEXT_PUBLIC_FEATURE_BULK_OPERATIONS = 'true';
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'false';
      
      const disabled = getDisabledFeatures();
      
      expect(disabled).toContain('SMART_RECOMMENDATIONS');
      expect(disabled).not.toContain('NEW_MENU_DESIGN');
      expect(disabled).not.toContain('BULK_OPERATIONS');
    });
  });

  describe('validateFeatureFlags', () => {
    it('should pass validation with default flags', () => {
      const validation = validateFeatureFlags();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect conflicting flags', () => {
      process.env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE = 'true';
      process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_UPDATES = 'true';
      
      const validation = validateFeatureFlags();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('OFFLINE_MODE and REAL_TIME_UPDATES cannot both be enabled');
    });

    it('should detect dependency violations', () => {
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'true';
      process.env.NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD = 'false';
      
      const validation = validateFeatureFlags();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('SMART_RECOMMENDATIONS requires ANALYTICS_DASHBOARD to be enabled');
    });

    it('should handle multiple validation errors', () => {
      process.env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE = 'true';
      process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_UPDATES = 'true';
      process.env.NEXT_PUBLIC_FEATURE_SMART_RECOMMENDATIONS = 'true';
      process.env.NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD = 'false';
      
      const validation = validateFeatureFlags();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('environment-specific behavior', () => {
    it('should handle test environment', () => {
      process.env.NODE_ENV = 'test';
      
      // Re-import to get fresh instance with test env
      jest.resetModules();
      const { getEnvironmentFeatureFlags } = require('../src/lib/featureFlags');
      
      const envFlags = getEnvironmentFeatureFlags();
      
      expect(envFlags.BULK_OPERATIONS).toBe(false);
      expect(envFlags.ADVANCED_EDITING).toBe(false);
    });

    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { getEnvironmentFeatureFlags } = require('../src/lib/featureFlags');
      
      const envFlags = getEnvironmentFeatureFlags();
      
      expect(envFlags.NEW_MENU_DESIGN).toBe(true);
      expect(envFlags.ADVANCED_FILTERS).toBe(true);
    });
  });
});
