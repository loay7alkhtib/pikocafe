import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { env } from './env';

// S3 configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // For MinIO or other S3-compatible services
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO
};

const s3Client = new S3Client(s3Config);

// Storage configuration
const STORAGE_CONFIG = {
  bucket: process.env.S3_BUCKET || 'piko-cafe-media',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  uploadExpiry: 3600, // 1 hour
  downloadExpiry: 86400, // 24 hours
} as const;

export interface MediaUploadRequest {
  keyBase: string;
  contentType: string;
  size: number;
}

export interface MediaUploadResponse {
  key: string;
  uploadUrl: string;
  downloadUrl: string;
  expiresAt: string;
  fields: Record<string, string>;
}

export interface MediaDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

// Validation helpers
export function validateMediaUpload(request: MediaUploadRequest): { valid: boolean; error?: string } {
  const { contentType, size } = request;

  if (!STORAGE_CONFIG.allowedMimeTypes.includes(contentType as any)) {
    return {
      valid: false,
      error: `Unsupported content type: ${contentType}. Allowed types: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`,
    };
  }

  if (size > STORAGE_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File too large: ${size} bytes. Maximum size: ${STORAGE_CONFIG.maxFileSize} bytes`,
    };
  }

  return { valid: true };
}

// Generate unique key for media
export function generateMediaKey(keyBase: string, contentType: string): string {
  const extension = contentType.split('/')[1] || 'bin';
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // Short UUID
  
  return `media/${keyBase}/${timestamp}-${uuid}.${extension}`;
}

// Generate presigned upload URL
export async function generateUploadUrl(request: MediaUploadRequest): Promise<MediaUploadResponse> {
  const validation = validateMediaUpload(request);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const key = generateMediaKey(request.keyBase, request.contentType);
  const expiresAt = new Date(Date.now() + STORAGE_CONFIG.uploadExpiry * 1000);

  try {
    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
      ContentType: request.contentType,
      ContentLength: request.size,
      Metadata: {
        'original-name': request.keyBase,
        'uploaded-at': new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: STORAGE_CONFIG.uploadExpiry });

    // Generate presigned GET URL for immediate access
    const downloadCommand = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: STORAGE_CONFIG.downloadExpiry });

    return {
      key,
      uploadUrl,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fields: {
        'Content-Type': request.contentType,
        'Content-Length': request.size.toString(),
      },
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

// Generate presigned download URL
export async function generateDownloadUrl(key: string): Promise<MediaDownloadResponse> {
  try {
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: STORAGE_CONFIG.downloadExpiry });
    const expiresAt = new Date(Date.now() + STORAGE_CONFIG.downloadExpiry * 1000);

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

// Delete media file
export async function deleteMedia(key: string): Promise<void> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw new Error('Failed to delete media file');
  }
}

// Health check for storage
export async function checkStorageHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const command = new HeadBucketCommand({
      Bucket: STORAGE_CONFIG.bucket,
    });

    await s3Client.send(command);
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }
}

// Utility functions
export function getMediaUrl(key: string): string {
  if (env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase')) {
    // For Supabase Storage
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_CONFIG.bucket}/${key}`;
  } else {
    // For custom S3/MinIO
    const endpoint = s3Config.endpoint || `https://${STORAGE_CONFIG.bucket}.s3.${s3Config.region}.amazonaws.com`;
    return `${endpoint}/${key}`;
  }
}

export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function getImageOptimizationParams(width?: number, height?: number, quality = 80): string {
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  return params.toString();
}

// Storage service class
export class StorageService {
  async uploadFile(request: MediaUploadRequest): Promise<MediaUploadResponse> {
    return generateUploadUrl(request);
  }

  async getFileUrl(key: string): Promise<MediaDownloadResponse> {
    return generateDownloadUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    return deleteMedia(key);
  }

  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    return checkStorageHealth();
  }

  getPublicUrl(key: string): string {
    return getMediaUrl(key);
  }
}

// Singleton instance
export const storageService = new StorageService();
