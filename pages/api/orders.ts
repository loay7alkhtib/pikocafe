import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
  
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Orders request failed' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Orders API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process orders request',
      details: error.toString()
    });
  }
}
