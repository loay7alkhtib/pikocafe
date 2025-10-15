// Supabase Configuration
// Replace these values with your actual Supabase project details

export const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'loay7alkhtib';
export const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYXk3YWxraHRpYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzNjUwNTQ4LCJleHAiOjIwNDkyMjY1NDh9.Nh8cZv5tR7q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8';

// Supabase URL
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://loay7alkhtib.supabase.co';

// Instructions for setup:
// 1. Go to your Supabase dashboard: https://supabase.com/dashboard
// 2. Select your project
// 3. Go to Settings > API
// 4. Copy the Project URL and anon/public key
// 5. Create a .env.local file in your project root with:
//    NEXT_PUBLIC_SUPABASE_URL=your-project-url
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
//    NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id

console.log('🔧 Supabase Config:', {
  projectId,
  supabaseUrl,
  hasAnonKey: !!publicAnonKey && publicAnonKey !== 'your-anon-key-here'
});
