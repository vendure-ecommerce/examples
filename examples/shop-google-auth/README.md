# shop-google-auth Example Store

This example demonstrates how to implement Google authentication in Vendure using Google's OAuth2 flow. It includes both the backend plugin for Vendure and a complete Next.js storefront with Google Sign-In integration.

## Features

- **Google OAuth2 Authentication**: Sign in with Google using Google Identity Services
- **Automatic User Creation**: Creates Vendure customer accounts from Google profile data
- **Seamless Integration**: Works alongside native Vendure authentication
- **Complete Frontend**: Next.js storefront with Google Sign-In button and user management

## Getting Started

### 1. Install Dependencies

```bash
# Install all dependencies (run from workspace root)
npm install

# Install backend dependencies specifically 
npm install --workspace=shop-google-auth
```

### 2. Configure Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins (e.g., `http://localhost:3001` for development)

### 3. Environment Variables

Create a `.env` file in the example directory:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here

# Vendure Configuration (optional overrides)
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=your-cookie-secret-here
```

For the frontend storefront, add to `vercel-commerce/.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
VENDURE_API_ENDPOINT=http://localhost:3000/shop-api
```

### 4. Run the Example

```bash
# Run backend (Vendure server + worker)
npm run dev --workspace=shop-google-auth

# Run frontend storefront (in another terminal)
cd examples/shop-google-auth/vercel-commerce
npm run dev
```

The backend will be available at:
- **API**: http://localhost:3000/shop-api
- **Admin**: http://localhost:3002/admin

The frontend storefront will be available at:
- **Storefront**: http://localhost:3001

## How It Works

### Backend Integration

The example includes a custom Vendure plugin (`ShopGoogleAuthPlugin`) that:

1. **Registers Authentication Strategy**: Adds `GoogleAuthStrategy` to Vendure's shop authentication strategies
2. **Verifies Google Tokens**: Uses `google-auth-library` to verify Google ID tokens
3. **Creates/Finds Users**: Automatically creates or finds existing customer accounts based on Google profile

### Frontend Integration

The Next.js storefront includes:

1. **Google Identity Services**: Loads Google's client-side library for OAuth
2. **Sign-In Component**: `GoogleSignInButton` handles the OAuth flow
3. **User Management**: Integration with Vendure's customer API for profile management

### Authentication Flow

1. User clicks "Continue with Google" button
2. Google Identity Services prompts for authorization
3. Google returns an ID token to the client
4. Client sends token to Vendure via GraphQL mutation
5. Vendure verifies token with Google and creates/finds user
6. Vendure returns session token for authenticated requests

## GraphQL Usage

The authentication can be used via GraphQL:

```graphql
mutation {
  authenticate(input: {
    google: {
      token: "google_id_token_here"
    }
  }) {
    __typename
    ... on CurrentUser {
      id
      identifier
    }
    ... on InvalidCredentialsError {
      message
    }
  }
}
```

## Customization

### Plugin Options

```typescript
ShopGoogleAuthPlugin.init({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  onUserCreated: (ctx, injector, user) => {
    // Custom logic when new user is created
  },
  onUserFound: (ctx, injector, user) => {
    // Custom logic when existing user signs in
  }
})
```

### Database

This example uses a separate SQLite database (`shop-google-auth.sqlite`) to avoid conflicts with other examples.

## Production Considerations

1. **HTTPS Required**: Google OAuth requires HTTPS in production
2. **Domain Configuration**: Update Google OAuth settings with production domain
3. **Environment Variables**: Use secure environment variable management
4. **Error Handling**: Implement proper error handling for OAuth failures
