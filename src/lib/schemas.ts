import { z } from 'zod';

// Common schemas
export const localizedTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  tr: z.string().min(1, 'Turkish text is required'),
  ar: z.string().min(1, 'Arabic text is required'),
});

export const itemVariantSchema = z.object({
  size: z.string().min(1, 'Size name is required'),
  price: z.number().positive('Price must be positive'),
});

export const orderItemSchema = z.object({
  id: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().positive('Price must be positive'),
  size: z.string().optional(),
});

// Category schemas
export const categorySchema = z.object({
  id: z.string().uuid(),
  names: localizedTextSchema,
  icon: z.string().min(1, 'Icon is required'),
  image: z.string().url().nullable(),
  order: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const categoryInsertSchema = z.object({
  names: localizedTextSchema,
  icon: z.string().min(1, 'Icon is required'),
  image: z.string().url().optional(),
  order: z.number().int().min(0).default(0),
});

export const categoryUpdateSchema = categoryInsertSchema.partial();

// Item schemas
export const itemSchema = z.object({
  id: z.string().uuid(),
  names: localizedTextSchema,
  descriptions: localizedTextSchema,
  prices: localizedTextSchema,
  category_id: z.string().uuid().nullable(),
  image: z.string().url().nullable(),
  media_key: z.string().nullable(),
  tags: z.array(z.string()),
  variants: z.array(itemVariantSchema).nullable(),
  order: z.number().int().min(0),
  archived_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const itemInsertSchema = z.object({
  names: localizedTextSchema,
  descriptions: localizedTextSchema.default({
    en: '',
    tr: '',
    ar: '',
  }),
  prices: localizedTextSchema,
  category_id: z.string().uuid().nullable(),
  image: z.string().url().optional(),
  media_key: z.string().optional(),
  tags: z.array(z.string()).default([]),
  variants: z.array(itemVariantSchema).optional(),
  order: z.number().int().min(0).default(0),
});

export const itemUpdateSchema = itemInsertSchema.partial();

// Order schemas
export const orderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(orderItemSchema),
  total: z.number().positive('Total must be positive'),
  status: z.enum(['pending', 'completed', 'cancelled']),
  customer_info: z.record(z.string(), z.any()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const orderInsertSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  total: z.number().positive('Total must be positive'),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  customer_info: z.record(z.string(), z.any()).optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
  customer_info: z.record(z.string(), z.any()).optional(),
});

// Media schemas
export const mediaSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1, 'Media key is required'),
  bucket: z.string().min(1, 'Bucket is required'),
  content_type: z.string().min(1, 'Content type is required'),
  size: z.number().positive('Size must be positive'),
  uploaded_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export const mediaInsertSchema = z.object({
  key: z.string().min(1, 'Media key is required'),
  bucket: z.string().min(1, 'Bucket is required'),
  content_type: z.string().min(1, 'Content type is required'),
  size: z.number().positive('Size must be positive'),
  uploaded_by: z.string().uuid().optional(),
});

// API request schemas
export const mediaSignRequestSchema = z.object({
  keyBase: z.string().min(1, 'Key base is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().positive('Size must be positive').max(10 * 1024 * 1024, 'File too large (max 10MB)'),
});

export const bulkUpdateSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, 'At least one item ID is required'),
  updates: z.record(z.any()).refine((val) => Object.keys(val).length > 0, 'Updates object cannot be empty'),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const categoryQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  archived: z.coerce.boolean().default(false),
});

// Export types
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type ItemVariant = z.infer<typeof itemVariantSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ItemInsert = z.infer<typeof itemInsertSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderInsert = z.infer<typeof orderInsertSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaInsert = z.infer<typeof mediaInsertSchema>;
export type MediaSignRequest = z.infer<typeof mediaSignRequestSchema>;
export type BulkUpdate = z.infer<typeof bulkUpdateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
