import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Checking categories status...');
    
    // Check if categories already exist using the Edge Function
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const categories = await response.json();
    
    if (categories && categories.length > 0) {
      console.log('✅ Categories already initialized:', categories.length);
      return res.status(200).json({ 
        message: 'Categories already exist',
        count: categories.length,
        status: 'already_initialized',
        categories: categories
      });
    }

    // If no categories exist, return success but don't initialize (data should be managed elsewhere)
    console.log('⚠️ No categories found - initialization should be done via database setup');
    return res.status(200).json({ 
      message: 'No categories found - please run database setup',
      status: 'needs_setup'
    });

  } catch (error: any) {
    console.error('❌ Category check error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to check categories',
      details: error.toString()
    });
  }
}
