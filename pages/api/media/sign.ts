import { NextApiRequest, NextApiResponse } from 'next';
import { withApiErrorHandler, sendOk, sendFail, setCorsHeaders, getRequestId, HTTP_STATUS } from '../../../src/lib/http';
import { mediaSignRequestSchema } from '../../../src/lib/schemas';
import { storageService } from '../../../src/lib/storage';
import { getServerDatabaseService } from '../../../src/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const requestId = getRequestId(req);
  
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    sendFail(res, 'Method not allowed', HTTP_STATUS.NOT_FOUND);
    return;
  }

  try {
    // Validate request body
    const validationResult = mediaSignRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      sendFail(res, `Invalid request: ${validationResult.error.message}`, HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const { keyBase, contentType, size } = validationResult.data;

    // Generate upload URL
    const uploadResponse = await storageService.uploadFile({
      keyBase,
      contentType,
      size,
    });

    // Log the media upload attempt
    console.log(`[${requestId}] Media upload signed:`, {
      key: uploadResponse.key,
      contentType,
      size,
      expiresAt: uploadResponse.expiresAt,
    });

    sendOk(res, uploadResponse, 'Upload URL generated successfully');
  } catch (error) {
    console.error(`[${requestId}] Media sign error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate upload URL';
    sendFail(res, errorMessage, 500);
  }
}

export default withApiErrorHandler(handler);
