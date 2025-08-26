# Vendure Examples Monorepo Refactoring Plan

## Objectives

1. **Centralize Vendure dependencies** at root level for consistent versioning
2. **Create base configurations** that examples can extend/override
3. **Migrate from SQLite to PostgreSQL** with Docker Compose
4. **Add Redis** for caching via Docker Compose
5. **Streamline example creation** using `@vendure/create` with post-processing
6. **TypeScript configuration inheritance** with base tsconfig
7. **Path aliases** to eliminate relative import paths

## Proposed Architecture

```
vendure-examples/
├── src/                         # Root-level shared code
│   ├── vendure-config.base.ts  # Base Vendure configuration
│   ├── index.base.ts           # Base server setup
│   └── index-worker.base.ts    # Base worker setup
├── examples/
│   ├── s3-file-storage/
│   │   ├── src/
│   │   │   ├── vendure-config.ts  # Extends base + S3 specific
│   │   │   ├── index.ts           # Imports base server
│   │   │   └── index-worker.ts    # Imports base worker
│   │   ├── tsconfig.json          # Extends tsconfig.base.json
│   │   └── package.json           # Only example-specific deps
│   ├── shop-github-auth/
│   └── shop-google-auth/
├── docker-compose.yml          # PostgreSQL + Redis
├── scripts/
│   └── create-example.js       # Enhanced creation script
├── package.json                # All Vendure packages
├── tsconfig.base.json          # Base TypeScript config with path aliases
└── .env.example
```

## Implementation Plan

### Phase 1: Root-Level Base Configuration

#### 1.1 Create Base Vendure Config (`src/vendure-config.base.ts`)
```typescript
import {
  VendureConfig,
  DefaultJobQueuePlugin,
  DefaultSearchPlugin,
  dummyPaymentHandler,
  mergeConfig,
} from "@vendure/core";
import { EmailPlugin } from "@vendure/email-plugin";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";

export const getBaseConfig = (): VendureConfig => {
  const IS_DEV = process.env.NODE_ENV !== 'production';
  
  return {
    apiOptions: {
      port: +(process.env.PORT || 3000),
      adminApiPath: "admin-api",
      shopApiPath: "shop-api",
      ...(IS_DEV && {
        adminApiDebug: true,
        shopApiDebug: true,
      }),
    },
    authOptions: {
      tokenMethod: ["bearer", "cookie"],
      superadminCredentials: {
        identifier: process.env.SUPERADMIN_USERNAME || "superadmin",
        password: process.env.SUPERADMIN_PASSWORD || "superadmin",
      },
    },
    dbConnectionOptions: {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || "vendure",
      password: process.env.DB_PASSWORD || "vendure",
      database: process.env.DB_NAME || "vendure",
      synchronize: true, // Auto-sync schema in development
      logging: process.env.DB_LOGGING === 'true',
    },
    paymentOptions: {
      paymentMethodHandlers: [dummyPaymentHandler],
    },
    plugins: [
      // Base plugins that all examples use
      DefaultJobQueuePlugin.init({
        connectionOptions: {
          type: 'redis',
          options: {
            host: process.env.REDIS_HOST || 'localhost',
            port: +(process.env.REDIS_PORT || 6379),
          },
        },
      }),
      DefaultSearchPlugin.init({ bufferUpdates: false }),
      AssetServerPlugin.init({
        route: "assets",
        assetUploadDir: "./static/assets",
      }),
      AdminUiPlugin.init({
        route: "admin",
      }),
    ],
  };
};

export const createBaseConfig = (overrides: Partial<VendureConfig> = {}): VendureConfig => {
  return mergeConfig(getBaseConfig(), overrides);
};
```

#### 1.2 Create Base Server (`src/index.base.ts`)
```typescript
import { bootstrap } from '@vendure/core';
import { VendureConfig } from '@vendure/core';

export async function runServer(config: VendureConfig) {
  const app = await bootstrap(config);
  return app;
}
```

#### 1.3 Create Base Worker (`src/index-worker.base.ts`)
```typescript
import { bootstrapWorker } from '@vendure/core';
import { VendureConfig } from '@vendure/core';

export async function runWorker(config: VendureConfig) {
  const worker = await bootstrapWorker(config);
  return worker;
}
```

### Phase 2: TypeScript Configuration

#### Root tsconfig.base.json
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2019",
    "lib": ["es2019", "esnext.asynciterable"],
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./src/*"],
      "@shared/config": ["./src/vendure-config.base"],
      "@shared/base": ["./src/vendure-config.base"],
      "@shared/server": ["./src/index.base"],
      "@shared/worker": ["./src/index-worker.base"]
    }
  }
}
```

#### Example tsconfig.json (extends base)
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
      "@shared/base": ["../../src/vendure-config.base"],
      "@shared/server": ["../../src/index.base"],
      "@shared/worker": ["../../src/index-worker.base"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Phase 3: Example Structure with Path Aliases

#### Example vendure-config.ts (with path aliases)
```typescript
import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';
import { ShopGithubAuthPlugin } from '@/plugins/shop-github-auth/shop-github-auth.plugin';

export const config = mergeConfig(
  getBaseConfig(),
  {
    plugins: [
      ShopGithubAuthPlugin.init({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
  }
);
```

#### Example index.ts (with path aliases)
```typescript
import { runServer } from '@shared/server';
import { config } from '@/vendure-config';

runServer(config)
  .then(() => console.log('Server started'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

#### Example index-worker.ts (with path aliases)
```typescript
import { runWorker } from '@shared/worker';
import { config } from '@/vendure-config';

runWorker(config)
  .then(() => console.log('Worker started'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

### Phase 4: Docker Compose Setup

#### Root `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: vendure-postgres
    environment:
      POSTGRES_USER: vendure
      POSTGRES_PASSWORD: vendure
      POSTGRES_DB: vendure
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - vendure-network

  redis:
    image: redis:7-alpine
    container_name: vendure-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - vendure-network

  adminer:
    image: adminer
    container_name: vendure-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    networks:
      - vendure-network

volumes:
  postgres_data:
  redis_data:

networks:
  vendure-network:
    driver: bridge
```

### Phase 5: Root Package.json

```json
{
  "name": "vendure-examples-workspace",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "create-example": "node scripts/create-example.js",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:reset": "docker-compose down -v && npm run docker:up",
    "dev": "npm run docker:up && echo 'Docker services started. Run npm run dev in any example directory'",
    "install:all": "npm install && npm install --workspaces"
  },
  "dependencies": {
    "@vendure/admin-ui-plugin": "3.4.0",
    "@vendure/asset-server-plugin": "3.4.0",
    "@vendure/core": "3.4.0",
    "@vendure/email-plugin": "3.4.0",
    "@vendure/graphiql-plugin": "3.4.0",
    "dotenv": "17.2.1",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vendure/cli": "3.4.0",
    "concurrently": "9.2.0",
    "ts-node": "^10.0.0",
    "typescript": "5.8.2"
  },
  "workspaces": [
    "examples/*"
  ]
}
```

### Phase 6: Enhanced Example Creation Script

#### `scripts/create-example.js`
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createExample(name) {
  const exampleDir = path.join(__dirname, '..', 'examples', name);
  
  // Step 1: Run Vendure create
  console.log(`Creating Vendure example: ${name}`);
  execSync(`npx @vendure/create ${name}`, {
    cwd: path.join(__dirname, '..', 'examples'),
    stdio: 'inherit'
  });
  
  // Step 2: Create tsconfig.json extending base
  const tsconfigPath = path.join(exampleDir, 'tsconfig.json');
  const tsconfigContent = {
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      outDir: "./dist",
      rootDir: "./src",
      baseUrl: ".",
      paths: {
        "@shared/*": ["../../src/*"],
        "@shared/config": ["../../src/vendure-config.base"],
        "@shared/base": ["../../src/vendure-config.base"],
        "@shared/server": ["../../src/index.base"],
        "@shared/worker": ["../../src/index-worker.base"],
        "@/*": ["./src/*"]
      }
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
  
  // Step 3: Post-process vendure-config.ts with path aliases
  const configPath = path.join(exampleDir, 'src', 'vendure-config.ts');
  const configContent = `
import { mergeConfig } from '@vendure/core';
import { getBaseConfig } from '@shared/config';

// Add your custom plugins and configuration here
const customPlugins = [];

export const config = mergeConfig(
  getBaseConfig(),
  {
    plugins: [
      ...customPlugins,
    ],
    // Add any other overrides here
  }
);
`;
  
  fs.writeFileSync(configPath, configContent);
  
  // Step 4: Update index.ts with path aliases
  const indexPath = path.join(exampleDir, 'src', 'index.ts');
  const indexContent = `
import { runServer } from '@shared/server';
import { config } from '@/vendure-config';

runServer(config)
  .then(() => console.log('Server started: ${name}'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
`;
  
  fs.writeFileSync(indexPath, indexContent);
  
  // Step 5: Update index-worker.ts with path aliases
  const workerPath = path.join(exampleDir, 'src', 'index-worker.ts');
  const workerContent = `
import { runWorker } from '@shared/worker';
import { config } from '@/vendure-config';

runWorker(config)
  .then(() => console.log('Worker started: ${name}'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
`;
  
  fs.writeFileSync(workerPath, workerContent);
  
  // Step 6: Update package.json to remove Vendure deps
  const packageJsonPath = path.join(exampleDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Remove Vendure packages that are now at root
  const vendurePackages = [
    '@vendure/admin-ui-plugin',
    '@vendure/asset-server-plugin',
    '@vendure/core',
    '@vendure/email-plugin',
    '@vendure/graphiql-plugin'
  ];
  
  vendurePackages.forEach(pkg => {
    delete packageJson.dependencies[pkg];
    delete packageJson.devDependencies[pkg];
  });
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log(`✅ Example '${name}' created and configured!`);
  console.log(`📝 Next steps:`);
  console.log(`  1. cd examples/${name}`);
  console.log(`  2. Add any custom plugins to src/vendure-config.ts`);
  console.log(`  3. Run 'npm run dev' to start the example`);
}

// Run the script
const exampleName = process.argv[2];
if (!exampleName) {
  console.error('Please provide an example name');
  process.exit(1);
}

createExample(exampleName);
```

## Migration Steps

### Week 1: Foundation
- [ ] Create `src/` directory with base configurations
- [ ] Create root `tsconfig.base.json` with path aliases
- [ ] Set up Docker Compose with PostgreSQL and Redis
- [ ] Update root `package.json` with all Vendure dependencies
- [ ] Create `.env.example` with all required variables

### Week 2: Example Migration
- [ ] Migrate `shop-github-auth` to use base config and path aliases
- [ ] Migrate `shop-google-auth` to use base config and path aliases
- [ ] Migrate `s3-file-storage` to use base config and path aliases
- [ ] Update all examples to extend `tsconfig.base.json`
- [ ] Test all examples with PostgreSQL and Redis

### Week 3: Tooling & Documentation
- [ ] Implement enhanced `create-example.js` script
- [ ] Add migration scripts for database setup
- [ ] Update README with new architecture
- [ ] Create developer guide for adding new examples

## Benefits

1. **Consistency**: All examples use same Vendure version and base config
2. **Maintainability**: Update base config once, affects all examples
3. **Production-Ready**: PostgreSQL and Redis setup matches production
4. **Rapid Development**: New examples created in seconds with `npm run create-example`
5. **Independent Execution**: Each example can still run standalone
6. **Reduced Duplication**: ~70% less duplicate code
7. **Clean Imports**: Path aliases eliminate "../../../" relative imports
8. **TypeScript Inheritance**: Single source of truth for TypeScript configuration
9. **Better IDE Support**: Path aliases provide better autocomplete and navigation

## Environment Variables

Create `.env` file at root:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=vendure
DB_PASSWORD=vendure
DB_NAME=vendure

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Vendure
PORT=3000
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
NODE_ENV=development
```

## Commands

```bash
# Start infrastructure
npm run docker:up

# Create new example
npm run create-example my-new-feature

# Run specific example
cd examples/shop-github-auth
npm run dev

# Stop infrastructure
npm run docker:down

# Reset everything
npm run docker:reset
```