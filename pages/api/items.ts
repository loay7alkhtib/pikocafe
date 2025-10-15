import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
    
    const response = await fetch(`${API_BASE}/items`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Items API error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch items',
      details: error.toString()
    });
  }
}
