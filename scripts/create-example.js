#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const storeName = process.argv[2];

if (!storeName) {
  console.error('Usage: pnpm create-example <store-name>');
  process.exit(1);
}

if (!/^[a-zA-Z0-9-_]+$/.test(storeName)) {
  console.error('Store name can only contain letters, numbers, hyphens, and underscores');
  process.exit(1);
}

const exampleDir = path.join(__dirname, '..', 'examples', storeName);

if (fs.existsSync(exampleDir)) {
  console.error(`Example store "${storeName}" already exists`);
  process.exit(1);
}

console.log(`Creating example store: ${storeName}`);

fs.mkdirSync(exampleDir, { recursive: true });
fs.mkdirSync(path.join(exampleDir, 'src'), { recursive: true });

const packageJson = {
  name: `vendure-example-${storeName}`,
  version: '1.0.0',
  description: `Vendure example store: ${storeName}`,
  main: 'dist/index.js',
  scripts: {
    'dev:server': 'ts-node ./src/index.ts',
    'dev:worker': 'ts-node ./src/index-worker.ts',
    dev: 'concurrently npm:dev:*',
    build: 'tsc',
    'start:server': 'node ./dist/index.js',
    'start:worker': 'node ./dist/index-worker.js',
    start: 'concurrently npm:start:*'
  },
  dependencies: {
    '@vendure/admin-ui-plugin': '3.4.0',
    '@vendure/asset-server-plugin': '3.4.0',
    '@vendure/core': '3.4.0',
    '@vendure/email-plugin': '3.4.0',
    '@vendure/graphiql-plugin': '3.4.0',
    'better-sqlite3': '11.10.0',
    'dotenv': '17.2.1'
  },
  devDependencies: {},
  keywords: ['vendure', 'ecommerce', 'example', storeName],
  author: '',
  license: 'MIT'
};

fs.writeFileSync(
  path.join(exampleDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

const tsConfig = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    outDir: './dist',
    rootDir: './src',
    composite: true
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist']
};

fs.writeFileSync(
  path.join(exampleDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

const indexTs = `import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';

const exampleConfig: VendureConfig = {
  ...config,
  apiOptions: {
    ...config.apiOptions,
    port: 3001,
  },
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: path.join(__dirname, '../${storeName}.sqlite'),
  },
  plugins: [
    ...(config.plugins || []).map((plugin: any) => {
      if (plugin.constructor.name === 'AdminUiPlugin') {
        return AdminUiPlugin.init({
          route: 'admin',
          port: 3003,
          adminUiConfig: {
            apiPort: 3001,
          },
        });
      }
      return plugin;
    }),
  ],
};

runMigrations(exampleConfig)
  .then(() => bootstrap(exampleConfig))
  .catch((err: any) => {
    console.log(err);
  });
`;

fs.writeFileSync(path.join(exampleDir, 'src', 'index.ts'), indexTs);

const workerTs = `import { bootstrapWorker } from '@vendure/core';
import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import path from 'path';

const exampleConfig: VendureConfig = {
  ...config,
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: path.join(__dirname, '../${storeName}.sqlite'),
  },
};

bootstrapWorker(exampleConfig)
  .then((worker: any) => worker.startJobQueue())
  .catch((err: any) => {
    console.log(err);
  });
`;

fs.writeFileSync(path.join(exampleDir, 'src', 'index-worker.ts'), workerTs);

const configPath = path.join(__dirname, '..', 'store', 'src', 'vendure-config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

configContent = configContent.replace(
  'process.env.SUPERADMIN_USERNAME',
  'process.env.SUPERADMIN_USERNAME || "superadmin"'
);
configContent = configContent.replace(
  'process.env.SUPERADMIN_PASSWORD',
  'process.env.SUPERADMIN_PASSWORD || "superadmin"'
);
configContent = configContent.replace(
  'process.env.COOKIE_SECRET',
  'process.env.COOKIE_SECRET || "cookie-secret-' + storeName + '"'
);
configContent = configContent.replace(
  '+process.env.PORT || 3000',
  '+(process.env.PORT || 3000)'
);

fs.writeFileSync(path.join(exampleDir, 'src', 'vendure-config.ts'), configContent);

const readmeMd = `# ${storeName} Example Store

This is an example Vendure store demonstrating specific features or configurations.

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Run in development mode (server + worker)
pnpm --filter vendure-example-${storeName} dev

# Run only server
pnpm --filter vendure-example-${storeName} dev:server

# Run only worker  
pnpm --filter vendure-example-${storeName} dev:worker

# Build the example
pnpm --filter vendure-example-${storeName} build
\`\`\`

## Description

Add a description of what this example demonstrates here.

## Configuration

This example extends the main Vendure store configuration. Customize the configuration in \`src/index.ts\`.
`;

fs.writeFileSync(path.join(exampleDir, 'README.md'), readmeMd);

console.log(`✅ Example store "${storeName}" created successfully!`);
console.log(`📁 Location: examples/${storeName}`);
console.log(`🚀 To get started:`);
console.log(`   pnpm install`);
console.log(`   pnpm dev:example ${storeName}`);

try {
  console.log('Installing dependencies...');
  execSync('pnpm install', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('⚠️  Failed to install dependencies automatically. Run "pnpm install" manually.');
}