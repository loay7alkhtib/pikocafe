import { NextApiRequest, NextApiResponse } from 'next';
import { projectId, publicAnonKey } from '../../src/utils/supabase/info';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔧 Testing Supabase connection...');
    console.log('Project ID:', projectId);
    console.log('Has anon key:', !!publicAnonKey);
    
    const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
    
    // Test basic connectivity
    const response = await fetch(`${API_BASE}/categories`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      res.status(200).json({
        success: true,
        message: 'Connection successful!',
        projectId,
        categoriesCount: Array.isArray(data) ? data.length : 0,
        data: Array.isArray(data) ? data.slice(0, 3) : data // Show first 3 categories
      });
    } else {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      res.status(response.status).json({
        success: false,
        message: 'API request failed',
        status: response.status,
        error: errorText
      });
    }
  } catch (error: any) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
      projectId,
      hasAnonKey: !!publicAnonKey
    });
  }
}
