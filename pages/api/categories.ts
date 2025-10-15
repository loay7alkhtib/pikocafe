import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
    
    // Handle different HTTP methods
    let response;
    
    if (req.method === 'GET') {
      // Get all categories
      response = await fetch(`${API_BASE}/categories`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
    } else if (req.method === 'POST') {
      // Create new category
      response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
    } else if (req.method === 'PUT') {
      // Update category
      const { id, ...updateData } = req.body;
      response = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
    } else if (req.method === 'DELETE') {
      // Delete category
      const { id } = req.query;
      response = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Categories API error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process categories request',
      details: error.toString()
    });
  }
}
