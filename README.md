# Piko Patisserie & Café

A modern cafe ordering system built with Next.js, React, and Tailwind CSS.

## Features

- 🍰 Browse menu categories and items
- 🛒 Shopping cart functionality
- 👤 User authentication and registration
- 🔐 Admin panel for menu management
- 🌍 Multi-language support (English, Turkish, Arabic)
- 📱 Responsive design for all devices
- ⚡ Fast performance with Next.js

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pikocafe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Project Structure

```
├── pages/                 # Next.js pages
│   ├── _app.tsx          # App wrapper with providers
│   ├── index.tsx         # Home page
│   ├── login.tsx         # Login page
│   ├── signup.tsx        # Registration page
│   ├── admin.tsx         # Admin dashboard
│   ├── admin-login.tsx   # Admin login
│   └── category/[id].tsx # Category menu pages
├── src/
│   ├── components/       # Reusable components
│   ├── lib/             # Utilities and contexts
│   ├── pages/           # Page components (legacy)
│   └── styles/          # Global styles
├── public/              # Static assets
└── ...config files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
