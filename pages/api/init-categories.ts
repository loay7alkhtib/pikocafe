import { NextApiRequest, NextApiResponse } from 'next';

import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
const ANON_KEY = publicAnonKey;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Initializing categories via API...');
    
    const response = await fetch(`${API_BASE}/init-categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Categories initialized:', result);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ Category initialization error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to initialize categories',
      details: error.toString()
    });
  }
}
