import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Session verification failed' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Auth session API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to verify session',
      details: error.toString()
    });
  }
}
