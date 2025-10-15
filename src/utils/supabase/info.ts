// Supabase Configuration
// Replace these values with your actual Supabase project details

export const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'lnpgrvtobvrxzqvtlwzz';
export const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Supabase URL
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnpgrvtobvrxzqvtlwzz.supabase.co';

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
