#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const storeName = process.argv[2];

if (!storeName) {
  console.error('Usage: pnpm create-template <store-name>');
  process.exit(1);
}

// Validate store name
if (!/^[a-zA-Z0-9-_]+$/.test(storeName)) {
  console.error('Store name can only contain letters, numbers, hyphens, and underscores');
  process.exit(1);
}

const templateDir = path.join(__dirname, '..', 'templates', storeName);

// Check if template already exists
if (fs.existsSync(templateDir)) {
  console.error(`Template store "${storeName}" already exists`);
  process.exit(1);
}

console.log(`Creating template store: ${storeName}`);

// Create directory structure
fs.mkdirSync(templateDir, { recursive: true });
fs.mkdirSync(path.join(templateDir, 'src'), { recursive: true });

// Create package.json
const packageJson = {
  name: `vendure-template-${storeName}`,
  version: '1.0.0',
  description: `Vendure template store: ${storeName}`,
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
    'vendure-main-store': 'workspace:*'
  },
  devDependencies: {},
  keywords: ['vendure', 'ecommerce', 'template', storeName],
  author: '',
  license: 'MIT'
};

fs.writeFileSync(
  path.join(templateDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create tsconfig.json
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
  path.join(templateDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

// Create basic index.ts
const indexTs = `import { bootstrap, runMigrations, config, VendureConfig, AdminUiPlugin } from 'vendure-main-store';
import path from 'path';

// Customize the config for this template
const templateConfig: VendureConfig = {
  ...config,
  apiOptions: {
    ...config.apiOptions,
    port: 3001, // Different port from main store
  },
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: path.join(__dirname, '../${storeName}.sqlite'), // Separate database
  },
  plugins: [
    ...(config.plugins || []).map((plugin: any) => {
      // Update AdminUI port to avoid conflicts
      if (plugin.constructor.name === 'AdminUiPlugin') {
        return AdminUiPlugin.init({
          route: 'admin',
          port: 3003, // Different admin port
          adminUiConfig: {
            apiPort: 3001,
          },
        });
      }
      return plugin;
    }),
  ],
};

runMigrations(templateConfig)
  .then(() => bootstrap(templateConfig))
  .catch((err: any) => {
    console.log(err);
  });
`;

fs.writeFileSync(path.join(templateDir, 'src', 'index.ts'), indexTs);

// Create index-worker.ts
const workerTs = `import { bootstrapWorker, config, VendureConfig } from 'vendure-main-store';
import path from 'path';

// Use the same customized config as the server
const templateConfig: VendureConfig = {
  ...config,
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
    logging: false,
    database: path.join(__dirname, '../${storeName}.sqlite'),
  },
};

bootstrapWorker(templateConfig)
  .then((worker: any) => worker.startJobQueue())
  .catch((err: any) => {
    console.log(err);
  });
`;

fs.writeFileSync(path.join(templateDir, 'src', 'index-worker.ts'), workerTs);

// Create README.md
const readmeMd = `# ${storeName} Template Store

This is a template Vendure store demonstrating specific features or configurations.

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Run in development mode (server + worker)
pnpm --filter vendure-template-${storeName} dev

# Run only server
pnpm --filter vendure-template-${storeName} dev:server

# Run only worker  
pnpm --filter vendure-template-${storeName} dev:worker

# Build the template
pnpm --filter vendure-template-${storeName} build
\`\`\`

## Description

Add a description of what this template demonstrates here.

## Configuration

This template extends the main Vendure store configuration. Customize the configuration in \`src/index.ts\`.
`;

fs.writeFileSync(path.join(templateDir, 'README.md'), readmeMd);

console.log(`✅ Template store "${storeName}" created successfully!`);
console.log(`📁 Location: templates/${storeName}`);
console.log(`🚀 To get started:`);
console.log(`   pnpm install`);
console.log(`   pnpm dev:template ${storeName}`);

// Install dependencies
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