# Shop GitHub Auth Example

A complete GitHub OAuth authentication implementation for Vendure, demonstrating how customers can sign in using their GitHub accounts. This example includes both a custom Vendure plugin for backend authentication and a Next.js frontend storefront.

## What's Included

### Backend (Vendure Plugin)
- **Custom GitHub Authentication Strategy** - Handles OAuth 2.0 flow with GitHub
- **Plugin Architecture** - Production-ready plugin following Vendure patterns
- **Automatic User Management** - Creates and manages customer accounts seamlessly
- **GraphQL Integration** - Extends shop API with GitHub authentication input

### Frontend (Next.js Storefront)
- **OAuth Sign-in Component** - "Continue with GitHub" button with proper flow handling
- **Callback Handler** - Processes GitHub OAuth redirects and exchanges tokens
- **Session Management** - Integrates with Vendure's authentication system
- **Complete UI** - Full e-commerce storefront with GitHub auth integration

### Documentation
- **Implementation Guide** (`guide.md`) - Step-by-step tutorial for recreating this in any Vendure store
- **Conceptual Overview** (`guide-tutorial.md`) - How GitHub auth fits into Vendure's architecture

## Prerequisites

- Node.js 18+
- GitHub account (for creating OAuth app)
- Basic understanding of Vendure and OAuth 2.0

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/vendure-ecommerce/vendure-examples.git
cd vendure-examples/examples/shop-github-auth
```

### 2. Set Up GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Configure:
   - **Application name**: `Vendure GitHub Auth Demo`
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/sign-in`
4. Save your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Create environment files with your GitHub OAuth credentials:

**Backend configuration** (`.env` in root):
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Frontend configuration** (`vercel-commerce/.env.local`):
```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
VENDURE_API_ENDPOINT=http://localhost:3000/shop-api
```

### 4. Install Dependencies

```bash
# Install workspace dependencies
npm install

# Install frontend dependencies
cd vercel-commerce
npm install
cd ..
```

### 5. Start the Servers

**Terminal 1 - Backend (Vendure):**
```bash
npm run dev:server --workspace=shop-github-auth
```

**Terminal 2 - Frontend (Next.js):**
```bash
cd vercel-commerce
npm run dev
```

## Access the Application

- **Storefront**: http://localhost:3001
- **Vendure Admin**: http://localhost:3002/admin
- **GraphQL Playground**: http://localhost:3000/shop-api

## Testing GitHub Authentication

### 1. Visit the Storefront
Navigate to http://localhost:3001 and click "Account" in the navigation.

*[PLACEHOLDER SCREENSHOT: Storefront homepage with navigation showing Account link]*

### 2. GitHub Sign-In
Click "Continue with GitHub" on the sign-in page.

*[PLACEHOLDER SCREENSHOT: Sign-in page showing "Continue with GitHub" button alongside traditional login form]*

### 3. GitHub Authorization
You'll be redirected to GitHub to authorize the application.

*[PLACEHOLDER SCREENSHOT: GitHub OAuth authorization page asking for permission]*

### 4. Successful Authentication
After authorization, you'll be redirected back and logged in automatically.

*[PLACEHOLDER SCREENSHOT: Account dashboard showing user logged in with GitHub username]*

### 5. Verify in Admin UI
Check the Vendure Admin UI to see the created customer account.

*[PLACEHOLDER SCREENSHOT: Vendure Admin showing customer with GitHub-generated email address]*

## How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Vendure   │    │   GitHub    │
│ (Next.js)   │    │  Backend    │    │    API      │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        │  1. Redirect to   │                   │
        │     GitHub        │                   │
        ├──────────────────────────────────────▶│
        │                   │                   │
        │  2. Authorization │                   │
        │     Code          │                   │
        ◄──────────────────────────────────────┤
        │                   │                   │
        │  3. Send Code to  │                   │
        │     Vendure       │                   │
        ├──────────────────▶│                   │
        │                   │  4. Exchange      │
        │                   │     for Token     │
        │                   ├──────────────────▶│
        │                   │  5. User Data     │
        │                   ◄──────────────────┤
        │  6. Session       │                   │
        │     Cookie        │                   │
        ◄──────────────────┤                   │
```

## Project Structure

```
shop-github-auth/
├── src/
│   ├── plugins/shop-github-auth/    # Custom Vendure plugin
│   │   ├── constants.ts             # Plugin constants
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── github-auth-strategy.ts  # OAuth strategy implementation
│   │   └── shop-github-auth.plugin.ts # Main plugin class
│   ├── vendure-config.ts            # Vendure configuration
│   ├── index.ts                     # Server entry point
│   └── index-worker.ts              # Worker process entry
├── vercel-commerce/                 # Next.js frontend
│   ├── components/account/          # Authentication components
│   ├── lib/vendure/                 # Vendure API integration
│   └── app/                         # Next.js app router pages
├── guide.md                         # Implementation tutorial
├── guide-tutorial.md               # Conceptual overview
└── README.md                       # This file
```

## Key Features Demonstrated

### Backend Plugin
- **Custom Authentication Strategy** following Vendure's plugin patterns
- **OAuth 2.0 Implementation** with proper security practices
- **External Authentication Service** integration for user management
- **Environment-based Configuration** for different deployment environments

### Frontend Integration
- **Framework-agnostic OAuth Flow** adaptable to any frontend framework
- **Proper Error Handling** for OAuth failures and edge cases
- **Session Management** using Vendure's authentication system
- **GraphQL Integration** with type-safe mutations and queries

## Advanced Testing

### GraphQL Mutation Testing

Use the `authenticate` mutation with GitHub auth data:

```graphql
mutation AuthenticateGitHub($input: AuthenticationInput!) {
  authenticate(input: $input) {
    __typename
    ... on CurrentUser {
      id
      identifier
    }
    ... on ErrorResult {
      errorCode
      message
    }
  }
}
```

### Schema Verification

Check if GitHub authentication is available:

```bash
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { __type(name: \"AuthenticationInput\") { inputFields { name type { name } } } }"
  }'
```

You should see a `github` field with `GitHubAuthInput` type in the response.

## Production Deployment

For production use, update your GitHub OAuth app with production URLs and ensure:

- HTTPS callback URLs
- Proper environment variable management
- Security headers and CORS configuration
- Database migrations and scaling considerations

## Learn More

- **Implementation Tutorial**: See `guide.md` for step-by-step recreation instructions
- **Architecture Overview**: Read `guide-tutorial.md` for conceptual understanding
- **Vendure Documentation**: [Authentication Strategies](https://docs.vendure.io)
- **GitHub OAuth**: [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/oauth-apps)

## Troubleshooting

### Common Issues

1. **404 on GitHub redirect**: Check `GITHUB_CLIENT_ID` environment variable
2. **Invalid client error**: Verify GitHub OAuth app callback URL matches your setup
3. **CORS errors**: Ensure frontend and backend URLs are properly configured
4. **Session not persisting**: Check that cookies are enabled and `credentials: 'include'` is used

### Need Help?

- Check the implementation guides in this directory
- Review the Vendure authentication documentation
- Examine the plugin source code for detailed implementation examples

This example demonstrates production-ready patterns for implementing third-party authentication in Vendure applications.