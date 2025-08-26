# Developer Guide

This guide explains how to work with the Vendure Examples monorepo architecture.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating New Examples](#creating-new-examples)
- [Working with Shared Configuration](#working-with-shared-configuration)
- [Path Aliases Reference](#path-aliases-reference)
- [Database Management](#database-management)
- [Testing Examples](#testing-examples)
- [Best Practices](#best-practices)

## Architecture Overview

The monorepo uses a **shared configuration pattern** where:

1. **Base configurations** live in `src/` and provide common Vendure setup
2. **Examples** extend base configs and add specific features
3. **Path aliases** eliminate relative imports and improve maintainability
4. **Centralized dependencies** ensure version consistency across examples

```
vendure-examples/
├── src/                           # Shared base configurations
│   ├── vendure-config.base.ts    # Base Vendure config
│   ├── index.base.ts             # Server bootstrap
│   └── index-worker.base.ts      # Worker bootstrap
├── examples/                      # Individual feature examples
├── tsconfig.base.json            # Base TypeScript configuration
└── package.json                  # Centralized Vendure dependencies
```

## Creating New Examples

### Method 1: Automated Creation (Recommended)

```bash
# Create a new example with full setup
npm run create-example payment-stripe

# This automatically:
# - Runs `npx @vendure/create payment-stripe`
# - Sets up tsconfig.json with path aliases
# - Creates vendure-config.ts extending base config
# - Updates index.ts and index-worker.ts files
# - Removes duplicate dependencies from package.json
```

### Method 2: Manual Creation

If you need more control over the creation process:

```bash
# 1. Create the example directory
cd examples
npx @vendure/create my-custom-example

# 2. Update tsconfig.json
cd my-custom-example
```

Create `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../../src/*"],
      "@shared/config": ["../../src/vendure-config.base"],
      "@shared/server": ["../../src/index.base"],
      "@shared/worker": ["../../src/index-worker.base"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Working with Shared Configuration

### Base Configuration (`src/vendure-config.base.ts`)

The base configuration provides:
- PostgreSQL database connection
- Redis job queue and caching
- Core plugins (AssetServer, AdminUI, Email, Search)
- Production-ready defaults

### Extending Base Configuration

In your example's `vendure-config.ts`:

```typescript
import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import { MyCustomPlugin } from '@/plugins/my-plugin';

export const config = mergeConfig(
  getBaseConfig(), // Gets PostgreSQL + Redis + core plugins
  {
    // Add custom plugins
    plugins: [
      MyCustomPlugin.init({
        apiKey: process.env.MY_API_KEY,
      }),
    ],
    
    // Override specific settings
    apiOptions: {
      port: 3001, // Override default port
    },
    
    // Add custom fields
    customFields: {
      Product: [
        { name: 'externalId', type: 'string' },
      ],
    },
  }
);
```

### Customizing Base Configuration

To modify the base configuration for all examples:

1. Edit `src/vendure-config.base.ts`
2. Changes automatically apply to all examples
3. Examples can still override specific settings

## Path Aliases Reference

The monorepo uses path aliases to eliminate relative imports:

| Alias | Points To | Usage |
|-------|-----------|--------|
| `@shared/config` | `src/vendure-config.base.ts` | Import base configuration |
| `@shared/server` | `src/index.base.ts` | Import server bootstrap |
| `@shared/worker` | `src/index-worker.base.ts` | Import worker bootstrap |
| `@shared/*` | `src/*` | Access any shared file |
| `@/*` | `./src/*` (example-specific) | Access example's own files |

### Example Usage

```typescript
// Instead of: import { getBaseConfig } from '../../src/vendure-config.base';
import { getBaseConfig } from '@shared/config';

// Instead of: import { runServer } from '../../src/index.base';
import { runServer } from '@shared/server';

// Instead of: import { MyPlugin } from './plugins/my-plugin';
import { MyPlugin } from '@/plugins/my-plugin';
```

## Database Management

### Infrastructure Setup

```bash
# Start PostgreSQL + Redis + Adminer
npm run docker:up

# View running containers
docker ps

# Access Adminer (database GUI) at http://localhost:8080
# Server: postgres, Username: vendure, Password: vendure
```

### Migration Commands

```bash
# Run migrations for all examples
npm run migrate-db

# Run migrations for specific example
npm run migrate-db shop-github-auth

# Reset database completely (⚠️ destroys all data)
npm run reset-db
```

### Database Connection Details

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `vendure`
- **Username**: `vendure`
- **Password**: `vendure`

All examples share the same database but use different schemas or table prefixes if needed.

## Testing Examples

### Running Examples

```bash
# Method 1: From example directory
cd examples/shop-github-auth
npm run dev

# Method 2: From root using workspaces
npm run dev --workspace=shop-github-auth
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure any example-specific variables
3. Ensure Docker services are running

### Accessing Services

When running an example:
- **Vendure Shop API**: `http://localhost:3000/shop-api`
- **Vendure Admin API**: `http://localhost:3000/admin-api`
- **Admin UI**: `http://localhost:3002/admin`
- **GraphQL Playground**: `http://localhost:3000/admin-api` (if GraphiQL plugin enabled)

## Best Practices

### 1. Configuration Organization

```typescript
// ✅ Good: Organize by feature
export const config = mergeConfig(
  getBaseConfig(),
  {
    plugins: [
      // Authentication plugins
      MyAuthPlugin.init(),
      
      // Payment plugins  
      StripePlugin.init(),
      
      // Custom business logic
      MyBusinessPlugin.init(),
    ],
  }
);

// ❌ Avoid: Random organization
```

### 2. Plugin Development

```typescript
// ✅ Good: Use path aliases
import { MyUtility } from '@/utils/my-utility';
import { BaseService } from '@shared/services/base';

// ❌ Avoid: Relative imports
import { MyUtility } from '../../../utils/my-utility';
```

### 3. Environment Variables

```typescript
// ✅ Good: Provide defaults and validation
const config = {
  apiKey: process.env.STRIPE_API_KEY || (() => {
    throw new Error('STRIPE_API_KEY is required');
  })(),
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'dev-secret',
};

// ❌ Avoid: No defaults or validation
const config = {
  apiKey: process.env.STRIPE_API_KEY,
};
```

### 4. Documentation

Each example should include:
- `README.md` with setup instructions
- Environment variable documentation
- Plugin configuration examples
- Testing instructions

### 5. Dependencies

```json
// ✅ Good: Only example-specific deps in package.json
{
  "dependencies": {
    "stripe": "^10.0.0",
    "express-rate-limit": "^6.0.0"
  }
}

// ❌ Avoid: Vendure deps (they're at root level)
{
  "dependencies": {
    "@vendure/core": "3.4.0",  // ❌ Already at root
    "stripe": "^10.0.0"
  }
}
```

### 6. TypeScript Configuration

- Always extend `../../tsconfig.base.json`
- Use path aliases consistently
- Keep example-specific compiler options minimal

## Troubleshooting

### Path Resolution Issues

If imports aren't resolving:

1. Check `tsconfig.json` extends the base config
2. Verify path aliases are correct
3. Restart TypeScript server in your IDE

### Database Connection Issues

If examples can't connect to PostgreSQL:

1. Ensure Docker services are running: `npm run docker:up`
2. Check Docker container status: `docker ps`
3. Verify environment variables in `.env`

### Plugin Loading Issues

If custom plugins aren't loading:

1. Check plugin is properly imported with path alias
2. Verify plugin is added to `plugins` array in config
3. Check for TypeScript compilation errors

### Build Issues

If examples fail to build:

1. Run `npm install` at root level
2. Check for TypeScript errors: `npx tsc --noEmit`
3. Verify all path aliases resolve correctly

## Contributing

When adding new features to the monorepo:

1. **Base Configuration**: Add common functionality to `src/`
2. **Examples**: Create focused examples demonstrating specific features
3. **Documentation**: Update this guide and README.md
4. **Testing**: Verify existing examples still work after changes

### Pull Request Checklist

- [ ] Example follows path alias patterns
- [ ] Documentation updated (README.md, DEVELOPER_GUIDE.md)
- [ ] Base configuration changes don't break existing examples
- [ ] Environment variables documented in `.env.example`
- [ ] Migration scripts work with new schema changes (if applicable)