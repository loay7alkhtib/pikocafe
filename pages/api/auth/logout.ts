import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
  
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Auth logout API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process logout request',
      details: error.toString()
    });
  }
}
