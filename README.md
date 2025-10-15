# Piko Patisserie & Café

A modern, production-ready cafe ordering system built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- 🍰 Browse menu categories and items
- 🛒 Shopping cart functionality
- 👤 User authentication and registration
- 🔐 Admin panel for menu management
- 🌍 Multi-language support (English, Turkish, Arabic)
- 📱 Responsive design for all devices
- ⚡ Fast performance with Next.js
- 🔒 Production-ready security with RLS
- 📊 Health monitoring and observability
- 🧪 Comprehensive testing suite
- 🚀 Automated CI/CD pipeline

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript with strict types
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Storage**: S3-compatible storage with presigned URLs
- **State Management**: React Query (@tanstack/react-query)
- **Testing**: Jest + Playwright
- **Monitoring**: Sentry (optional)
- **Deployment**: Vercel

### Project Structure

```
├── pages/                    # Next.js pages (routes)
│   ├── api/                 # API routes
│   ├── admin.tsx            # Admin dashboard
│   ├── admin-login.tsx      # Admin login
│   └── category/[id].tsx    # Category pages
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── ErrorBoundary.tsx
│   │   └── Skeletons.tsx   # Loading states
│   ├── lib/                # Utilities and configurations
│   │   ├── env.ts          # Environment validation
│   │   ├── schemas.ts      # Zod validation schemas
│   │   ├── supabase.ts     # Database client
│   │   ├── storage.ts      # File storage utilities
│   │   ├── http.ts         # API response helpers
│   │   ├── logger.ts       # Structured logging
│   │   ├── queryClient.ts  # React Query configuration
│   │   └── featureFlags.ts # Feature toggles
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── tests/                  # Test files
│   ├── e2e/               # End-to-end tests
│   └── *.test.ts          # Unit tests
├── scripts/               # Utility scripts
└── .github/workflows/     # CI/CD pipeline
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database and authentication)
- S3-compatible storage (AWS S3, MinIO, etc.)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd pikocafe
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Storage Configuration (S3-compatible)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your_bucket_name
S3_ENDPOINT=https://your-s3-endpoint.com  # Optional for MinIO

# Optional Monitoring
SENTRY_DSN=your_sentry_dsn

# Feature Flags (Optional)
NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN=false
NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD=false
```

4. **Set up the database:**
```bash
# Run database migrations (if any)
npm run db:migrate

# Seed initial data
npm run db:seed
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Coverage
```bash
npm run test:coverage
```

### Health Check
```bash
npm run health-check
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main**

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `SENTRY_DSN` (optional)

## 🔧 Configuration

### Feature Flags

Control feature rollout using environment variables:

```env
NEXT_PUBLIC_FEATURE_NEW_MENU_DESIGN=true
NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD=true
NEXT_PUBLIC_FEATURE_BULK_OPERATIONS=true
```

### Database Security

The application uses Row Level Security (RLS) policies:

- **Anonymous users**: Read-only access to public data
- **Authenticated users**: Can create orders
- **Admin users**: Full CRUD access via service role

### File Storage

- **Uploads**: Use presigned URLs for secure file uploads
- **Downloads**: Generate presigned URLs for file access
- **Supported formats**: JPEG, PNG, WebP, GIF
- **Max file size**: 10MB

## 📊 Monitoring & Observability

### Health Endpoint

Check application health at `/api/health`:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "healthy", "responseTime": 45 },
    "storage": { "status": "healthy", "responseTime": 120 }
  },
  "environment": "production"
}
```

### Logging

Structured logging with request IDs:

```javascript
import { createLogger } from './src/lib/logger';

const logger = createLogger('API', requestId);
logger.info('Request processed', { userId, duration });
```

### Error Tracking

Optional Sentry integration for error monitoring:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🔒 Security

### Authentication

- **Admin Panel**: Protected with Supabase Auth
- **Session Management**: Secure token handling
- **Password Requirements**: Enforced by Supabase

### Data Protection

- **RLS Policies**: Database-level access control
- **Input Validation**: Zod schemas for all API inputs
- **File Upload Security**: Content type and size validation
- **CORS**: Configured for production domains

### Environment Security

- **Service Role Key**: Never exposed to client
- **Environment Variables**: Validated on startup
- **Production Checks**: Fail-fast on invalid config

## 🚀 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

1. **Code Quality**: TypeScript, ESLint, tests
2. **Unit Tests**: Jest with coverage reporting
3. **E2E Tests**: Playwright across multiple browsers
4. **Security**: Dependency audit and vulnerability scanning
5. **Health Check**: Post-deployment verification
6. **Deployment**: Automatic deployment to Vercel

### Pipeline Stages

- **Test**: Run on Node.js 18.x and 20.x
- **E2E**: Cross-browser testing
- **Security**: Audit dependencies
- **Deploy Staging**: Auto-deploy from `develop` branch
- **Deploy Production**: Auto-deploy from `main` branch

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run the test suite**: `npm test`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Use strict typing
- **Testing**: Write tests for new features
- **Documentation**: Update README for significant changes
- **Commits**: Use conventional commit messages
- **Code Style**: Follow ESLint configuration

## 📝 API Documentation

### Authentication

```typescript
// Admin login
POST /api/auth/login
{
  "email": "admin@piko.com",
  "password": "admin123"
}

// Session verification
GET /api/auth/session
Authorization: Bearer <token>
```

### Categories

```typescript
// Get all categories
GET /api/categories

// Create category
POST /api/categories
{
  "names": { "en": "Hot Drinks", "tr": "Sıcak İçecekler", "ar": "مشروبات ساخنة" },
  "icon": "☕",
  "order": 1
}

// Update category
PUT /api/categories/:id
{
  "names": { "en": "Updated Name" }
}

// Delete category
DELETE /api/categories/:id
```

### Items

```typescript
// Get items (optionally filtered by category)
GET /api/items?category_id=cat-hot-drinks

// Create item
POST /api/items
{
  "names": { "en": "Espresso", "tr": "Espresso", "ar": "إسبريسو" },
  "prices": { "en": "12.00", "tr": "12.00", "ar": "12.00" },
  "category_id": "cat-hot-drinks",
  "tags": ["coffee", "strong"]
}

// Update item
PUT /api/items/:id
{
  "names": { "en": "Updated Name" }
}

// Archive item (soft delete)
DELETE /api/items/:id
```

### Media Upload

```typescript
// Get presigned upload URL
POST /api/media/sign
{
  "keyBase": "category-image",
  "contentType": "image/jpeg",
  "size": 1024000
}

// Response
{
  "key": "media/category-image/1640995200000-abc123.jpg",
  "uploadUrl": "https://s3.amazonaws.com/bucket/...",
  "downloadUrl": "https://s3.amazonaws.com/bucket/...",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🎯 Roadmap

- [ ] Real-time order updates
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Inventory management
- [ ] Customer loyalty program
- [ ] Multi-location support

---

**Built with ❤️ for the perfect cafe experience**