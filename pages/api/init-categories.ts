import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE = 'https://loay7alkhtib.supabase.co/functions/v1/make-server-4050140e';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYXk3YWxraHRpYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzNjUwNTQ4LCJleHAiOjIwNDkyMjY1NDh9.Nh8cZv5tR7q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8';

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
