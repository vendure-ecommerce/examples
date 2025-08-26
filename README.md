<p align="center">
  <a href="https://vendure.io">
    <img alt="Vendure logo" height="60" width="auto" src="https://a.storyblok.com/f/192301/252x200/c6608214a9/brand-icon-primary.svg">
  </a>
</p>

<h1 align="center">
  Vendure Examples Monorepo
</h1>
<p align="center">
  A production-ready monorepo workspace with shared Vendure configurations, PostgreSQL, Redis, and streamlined example creation.
</p>

<p align="center">
  <a href="https://vendure.io/community">
    <img src="https://img.shields.io/badge/join-our%20discord-7289DA.svg" alt="Join our Discord" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=vendure_io">
    <img src="https://img.shields.io/twitter/follow/vendure_io" alt="Follow @vendure_io" />
  </a>
</p>

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
npm run docker:up

# 3. Create a new example
npm run create-example my-feature

# 4. Run the example
cd examples/my-feature
npm run dev
```

## 🏗️ Architecture

This monorepo uses a **shared configuration pattern** with production-ready infrastructure:

```
vendure-examples/
├── src/                      # 🔧 Shared base configurations
│   ├── vendure-config.base.ts   # Base Vendure config (PostgreSQL + Redis)
│   ├── index.base.ts            # Server bootstrap logic
│   └── index-worker.base.ts     # Worker bootstrap logic
├── examples/                 # 📦 Individual examples
│   ├── shop-github-auth/        # GitHub OAuth example
│   ├── shop-google-auth/        # Google OAuth example  
│   └── s3-file-storage/         # S3-compatible storage example
├── docker-compose.yml        # 🐳 PostgreSQL + Redis + Adminer
├── scripts/
│   ├── create-example.js        # Automated example creation
│   ├── migrate-db.js           # Database migration utilities
│   └── reset-db.js             # Database reset utilities
├── package.json             # 📋 Centralized Vendure dependencies
└── tsconfig.base.json       # 🔧 Base TypeScript config with path aliases
```

### Key Features

- **🏢 Production-Ready**: PostgreSQL + Redis instead of SQLite
- **🔄 Shared Dependencies**: All Vendure packages centralized at root
- **🛤️ Path Aliases**: Clean imports like `@shared/config`, `@/plugins`
- **⚡ Fast Creation**: New examples in seconds with `npm run create-example`
- **🧩 Extensible**: Examples extend base config with `mergeConfig()`
- **🐳 Docker Integration**: Full infrastructure with Docker Compose
- **📊 Database Tools**: Migration and reset utilities included

## 📋 Commands

| Command | Description |
|---------|-------------|
| **Infrastructure** |
| `npm run docker:up` | Start PostgreSQL + Redis services |
| `npm run docker:down` | Stop all services |
| `npm run docker:reset` | Reset database with fresh containers |
| **Development** |
| `npm run create-example <name>` | Create new example with base config |
| `npm run list:examples` | List all available examples |
| **Database** |
| `npm run migrate-db [example]` | Run migrations (all or specific example) |
| `npm run reset-db` | Completely reset database (⚠️ destroys data) |

## 🔨 Example Structure

Each example extends the base configuration:

```
examples/my-feature/
├── src/
│   ├── vendure-config.ts    # Extends @shared/config
│   ├── index.ts            # Uses @shared/server
│   ├── index-worker.ts     # Uses @shared/worker
│   └── plugins/            # Custom plugins (if any)
├── package.json           # Only example-specific dependencies
├── tsconfig.json          # Extends ../../tsconfig.base.json
└── README.md             # Usage instructions
```

### Example Configuration Pattern

```typescript
// examples/my-feature/src/vendure-config.ts
import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import { MyCustomPlugin } from '@/plugins/my-custom-plugin';

export const config = mergeConfig(
  getBaseConfig(), // PostgreSQL + Redis + core plugins
  {
    plugins: [
      MyCustomPlugin.init({
        // custom options
      }),
    ],
    // Additional overrides
  }
);
```

## 🛠️ Development Workflow

1. **Infrastructure**: `npm run docker:up` - Start PostgreSQL + Redis
2. **Create**: `npm run create-example payment-gateway` - Generate new example
3. **Develop**: Edit `examples/payment-gateway/src/vendure-config.ts`
4. **Test**: `cd examples/payment-gateway && npm run dev`
5. **Deploy**: Copy config to production Vendure project

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database (Docker defaults)
DB_HOST=localhost
DB_PORT=5432
DB_USER=vendure
DB_PASSWORD=vendure
DB_NAME=vendure

# Redis (Docker defaults)  
REDIS_HOST=localhost
REDIS_PORT=6379

# Vendure
PORT=3000
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
NODE_ENV=development
```

## 🗃️ Database Management

### Docker Services
- **PostgreSQL**: `localhost:5432` (username: `vendure`, password: `vendure`)
- **Redis**: `localhost:6379`
- **Adminer**: `localhost:8080` (database GUI)

### Migration Commands
```bash
# Migrate all examples
npm run migrate-db

# Migrate specific example
npm run migrate-db shop-github-auth

# Reset database (⚠️ destroys all data)
npm run reset-db
```

