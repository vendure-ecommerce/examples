# Vercel Commerce with GitHub Authentication

This is a Next.js e-commerce storefront that integrates with the Vendure GitHub Auth plugin to provide social authentication via GitHub OAuth.

## Features

- **GitHub OAuth Sign-In**: One-click authentication using GitHub accounts
- **Fallback Authentication**: Traditional email/password login as backup
- **Seamless Integration**: Unified authentication experience
- **User Account Management**: Full account features for GitHub-authenticated users
- Next.js App Router with React Server Components
- Optimized for SEO using Next.js's Metadata
- Server Actions for mutations
- Styling with Tailwind CSS and Radix UI components

## Quick Start

1. **Start the Vendure backend**:
   ```bash
   # From the parent directory
   npm run dev:server --workspace=shop-github-auth
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # Copy and update the environment file
   cp .env.local .env.local.example
   ```
   
   Update `.env.local` with your GitHub Client ID:
   ```env
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
   VENDURE_API_ENDPOINT=http://localhost:3000/shop-api
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/shop-api

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `Vendure Demo Store`
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/sign-in`
4. Save the Client ID and Client Secret

### 2. Configure Backend

Update `examples/shop-github-auth/.env`:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Configure Frontend

Update `vercel-commerce/.env.local`:
```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

## How It Works

### Authentication Flow

1. **User clicks "Continue with GitHub"** on `/sign-in` page
2. **Redirects to GitHub** OAuth authorization page
3. **User authorizes** the application
4. **GitHub redirects back** to `/sign-in?code=AUTH_CODE`
5. **Frontend exchanges code** for Vendure authentication via GraphQL
6. **Vendure creates/finds user** and returns session cookie
7. **User is redirected** to their account page

### Key Components

#### Frontend (`/components/account/`)
- `github-sign-in-button.tsx` - GitHub OAuth initiation and callback handling
- `sign-in-form.tsx` - Traditional email/password form
- `actions.ts` - Server actions for authentication

#### Backend Integration (`/lib/vendure/`)
- `index.ts` - `authenticateWithGitHub(code)` function
- GraphQL mutations use existing `authenticate` mutation with `github` input

## Testing

### Test GitHub Authentication

1. **Configure real GitHub OAuth app** (required for testing)
2. **Start both backend and frontend** servers
3. **Navigate to** http://localhost:3001/sign-in
4. **Click "Continue with GitHub"**
5. **Complete OAuth flow** and verify user creation

Your app should now be running on [localhost:3001](http://localhost:3001/).
