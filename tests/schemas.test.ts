import { z } from 'zod';
import {
  categorySchema,
  categoryInsertSchema,
  itemSchema,
  itemInsertSchema,
  orderSchema,
  orderInsertSchema,
  mediaSignRequestSchema,
  localizedTextSchema,
  itemVariantSchema,
} from '../src/lib/schemas';

describe('Schema Validation', () => {
  describe('localizedTextSchema', () => {
    it('should validate correct localized text', () => {
      const validText = {
        en: 'Hot Drinks',
        tr: 'Sıcak İçecekler',
        ar: 'مشروبات ساخنة',
      };

      const result = localizedTextSchema.safeParse(validText);
      expect(result.success).toBe(true);
    });

    it('should reject missing languages', () => {
      const invalidText = {
        en: 'Hot Drinks',
        tr: 'Sıcak İçecekler',
        // Missing ar
      };

      const result = localizedTextSchema.safeParse(invalidText);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['ar']);
      }
    });

    it('should reject empty strings', () => {
      const invalidText = {
        en: '',
        tr: 'Sıcak İçecekler',
        ar: 'مشروبات ساخنة',
      };

      const result = localizedTextSchema.safeParse(invalidText);
      expect(result.success).toBe(false);
    });
  });

  describe('itemVariantSchema', () => {
    it('should validate correct variant', () => {
      const validVariant = {
        size: 'Large',
        price: 15.50,
      };

      const result = itemVariantSchema.safeParse(validVariant);
      expect(result.success).toBe(true);
    });

    it('should reject negative prices', () => {
      const invalidVariant = {
        size: 'Large',
        price: -5.00,
      };

      const result = itemVariantSchema.safeParse(invalidVariant);
      expect(result.success).toBe(false);
    });

    it('should reject empty size', () => {
      const invalidVariant = {
        size: '',
        price: 15.50,
      };

      const result = itemVariantSchema.safeParse(invalidVariant);
      expect(result.success).toBe(false);
    });
  });

  describe('categoryInsertSchema', () => {
    it('should validate correct category insert', () => {
      const validCategory = {
        names: {
          en: 'Hot Drinks',
          tr: 'Sıcak İçecekler',
          ar: 'مشروبات ساخنة',
        },
        icon: '☕',
        order: 1,
      };

      const result = categoryInsertSchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should set default order to 0', () => {
      const categoryWithoutOrder = {
        names: {
          en: 'Hot Drinks',
          tr: 'Sıcak İçecekler',
          ar: 'مشروبات ساخنة',
        },
        icon: '☕',
      };

      const result = categoryInsertSchema.safeParse(categoryWithoutOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(0);
      }
    });

    it('should reject missing required fields', () => {
      const invalidCategory = {
        names: {
          en: 'Hot Drinks',
          tr: 'Sıcak İçecekler',
          ar: 'مشroبات ساخنة',
        },
        // Missing icon
      };

      const result = categoryInsertSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('itemInsertSchema', () => {
    it('should validate correct item insert', () => {
      const validItem = {
        names: {
          en: 'Espresso',
          tr: 'Espresso',
          ar: 'إسبريسو',
        },
        descriptions: {
          en: 'Strong coffee shot',
          tr: 'Güçlü kahve',
          ar: 'قهوة قوية',
        },
        prices: {
          en: '12.00',
          tr: '12.00',
          ar: '12.00',
        },
        category_id: 'cat-hot-drinks',
        tags: ['coffee', 'strong'],
        order: 1,
      };

      const result = itemInsertSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should set default values', () => {
      const itemWithDefaults = {
        names: {
          en: 'Espresso',
          tr: 'Espresso',
          ar: 'إسبريسو',
        },
        prices: {
          en: '12.00',
          tr: '12.00',
          ar: '12.00',
        },
      };

      const result = itemInsertSchema.safeParse(itemWithDefaults);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.descriptions).toEqual({
          en: '',
          tr: '',
          ar: '',
        });
        expect(result.data.tags).toEqual([]);
        expect(result.data.order).toBe(0);
      }
    });
  });

  describe('orderInsertSchema', () => {
    it('should validate correct order insert', () => {
      const validOrder = {
        items: [
          {
            id: 'item-1',
            quantity: 2,
            name: 'Espresso',
            price: 12.00,
          },
        ],
        total: 24.00,
        status: 'pending',
      };

      const result = orderInsertSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should default status to pending', () => {
      const orderWithoutStatus = {
        items: [
          {
            id: 'item-1',
            quantity: 1,
            name: 'Espresso',
            price: 12.00,
          },
        ],
        total: 12.00,
      };

      const result = orderInsertSchema.safeParse(orderWithoutStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
      }
    });

    it('should reject empty items array', () => {
      const invalidOrder = {
        items: [],
        total: 0,
      };

      const result = orderInsertSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject negative total', () => {
      const invalidOrder = {
        items: [
          {
            id: 'item-1',
            quantity: 1,
            name: 'Espresso',
            price: 12.00,
          },
        ],
        total: -5.00,
      };

      const result = orderInsertSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('mediaSignRequestSchema', () => {
    it('should validate correct media sign request', () => {
      const validRequest = {
        keyBase: 'category-image',
        contentType: 'image/jpeg',
        size: 1024000, // 1MB
      };

      const result = mediaSignRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject file too large', () => {
      const invalidRequest = {
        keyBase: 'category-image',
        contentType: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB
      };

      const result = mediaSignRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid content type', () => {
      const invalidRequest = {
        keyBase: 'category-image',
        contentType: 'text/plain',
        size: 1024000,
      };

      const result = mediaSignRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject negative size', () => {
      const invalidRequest = {
        keyBase: 'category-image',
        contentType: 'image/jpeg',
        size: -1000,
      };

      const result = mediaSignRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
