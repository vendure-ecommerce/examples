# Shop GitHub Auth Example

This example demonstrates how to implement GitHub OAuth authentication in a Vendure shop using the `ShopGithubAuthPlugin`.

## Plugin Overview

The `ShopGithubAuthPlugin` provides GitHub OAuth authentication for your Vendure shop, allowing customers to sign in using their GitHub accounts.

## Features

- GitHub OAuth authentication for shop customers
- Automatic user creation and management
- Customizable user creation and login callbacks
- Secure token handling

## Configuration

### 1. GitHub OAuth App Setup

First, create a GitHub OAuth App:

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: Your site URL (e.g., `http://localhost:3000`)
   - **Authorization callback URL**: Your auth callback URL (e.g., `http://localhost:3000/auth/github/callback`)
4. Save the Client ID and Client Secret

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Plugin Configuration

The plugin is already configured in `src/vendure-config.ts`:

```typescript
import { ShopGithubAuthPlugin } from "./plugins/shop-github-auth/shop-github-auth.plugin";

// In your plugins array:
ShopGithubAuthPlugin.init({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  // Optional callbacks:
  onUserCreated: (ctx, injector, user) => {
    // Custom logic when a new user is created
    console.log('New user created:', user.identifier);
  },
  onUserFound: (ctx, injector, user) => {
    // Custom logic when an existing user logs in
    console.log('User logged in:', user.identifier);
  },
})
```

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode (server + worker)
npm run dev --workspace=shop-github-auth

# Run only server
npm run dev:server --workspace=shop-github-auth

# Run only worker  
npm run dev:worker --workspace=shop-github-auth

# Build the example
npm run build --workspace=shop-github-auth
```

## Usage

### GraphQL Mutation

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

Variables:
```json
{
  "input": {
    "github": {
      "code": "authorization_code_from_github"
    }
  }
}
```

### Frontend Integration

In your frontend application, redirect users to GitHub's OAuth URL:

```javascript
const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
window.location.href = githubAuthUrl;
```

After GitHub redirects back with a code, use it in the GraphQL mutation above.

## Testing with curl

### 1. Verify Plugin is Loaded

First, check if the GitHub authentication input is available in the schema:

```bash
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { __type(name: \"AuthenticationInput\") { inputFields { name type { name inputFields { name type { name } } } } } }"
  }'
```

You should see a `github` field with `GitHubAuthInput` type in the response.

### 2. Get GitHub Authorization Code

To get an authorization code for testing:

1. Replace `YOUR_CLIENT_ID` with your actual GitHub Client ID:
   ```bash
   open "https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/callback&scope=user:email"
   ```

2. Complete the GitHub OAuth flow and copy the `code` parameter from the redirect URL

### 3. Test Authentication

Replace `YOUR_AUTHORIZATION_CODE` with the code from step 2:

```bash
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation TestGitHubAuth($input: AuthenticationInput!) { authenticate(input: $input) { __typename ... on CurrentUser { id identifier } ... on ErrorResult { errorCode message } } }",
    "variables": {
      "input": {
        "github": {
          "code": "YOUR_AUTHORIZATION_CODE"
        }
      }
    }
  }'
```

### 4. Expected Responses

**Success Response:**
```json
{
  "data": {
    "authenticate": {
      "__typename": "CurrentUser",
      "id": "2",
      "identifier": "username-github@vendure.io"
    }
  }
}
```

**Error Response (invalid code):**
```json
{
  "data": {
    "authenticate": {
      "__typename": "InvalidCredentialsError",
      "errorCode": "INVALID_CREDENTIALS_ERROR",
      "message": "Invalid credentials"
    }
  }
}
```

### 5. Verify User Creation

Check if the user was created in the database:

```bash
# Using sqlite3
sqlite3 shop-github-auth.sqlite "SELECT identifier, verified FROM user WHERE identifier LIKE '%-github@vendure.io';"

# Or query via GraphQL (as authenticated user)
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "query": "query { activeCustomer { id firstName lastName emailAddress } }"
  }'
```

### 6. Test Error Cases

**Test with invalid authorization code:**
```bash
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { authenticate(input: { github: { code: \"invalid_code\" } }) { __typename ... on ErrorResult { errorCode message } } }"
  }'
```

**Test with missing environment variables** (should not add GitHub strategy):
```bash
# Stop server, remove .env, restart server
# Then run schema check - should not show github field
curl -X POST http://localhost:3000/shop-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { __type(name: \"AuthenticationInput\") { inputFields { name } } }"
  }'
```

## Plugin Architecture

The plugin consists of:

- **ShopGithubAuthPlugin**: Main plugin class that configures the authentication strategy
- **GithubAuthStrategy**: Implements the GitHub OAuth flow
- **Types**: TypeScript interfaces for configuration options
- **Constants**: Plugin constants and symbols

## Portability

This example is fully portable and can be copied to any Vendure project. Simply:

1. Copy the `plugins/shop-github-auth` directory to your project
2. Import and configure the plugin in your `vendure-config.ts`
3. Set up the required environment variables
4. Configure your GitHub OAuth app with the correct callback URLs

## Security Notes

- Store your GitHub client secret securely and never commit it to version control
- Use environment variables for sensitive configuration
- The plugin generates secure email addresses for GitHub users (`{username}-github@vendure.io`)
- Users are automatically verified when created through GitHub auth
