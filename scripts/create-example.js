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
const storeDir = path.join(__dirname, '..', 'store');

if (fs.existsSync(exampleDir)) {
  console.error(`Example store "${storeName}" already exists`);
  process.exit(1);
}

console.log(`Creating example store: ${storeName}`);

function copyRecursiveSync(src, dest, excludes = []) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      if (!excludes.includes(file)) {
        copyRecursiveSync(
          path.join(src, file), 
          path.join(dest, file), 
          excludes
        );
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(storeDir, exampleDir, [
  'node_modules', 
  'dist', 
  'vendure.sqlite', 
  'package-lock.json'
]);

const packageJsonPath = path.join(exampleDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.name = `vendure-example-${storeName}`;
packageJson.description = `Vendure example store: ${storeName}`;
packageJson.keywords = [...(packageJson.keywords || []), 'example', storeName];

// Add bcrypt as direct dependency to avoid native binding issues
packageJson.dependencies = {
  ...packageJson.dependencies,
  'bcrypt': '5.1.1'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

const indexTsPath = path.join(exampleDir, 'src', 'index.ts');
let indexTs = fs.readFileSync(indexTsPath, 'utf8');

indexTs = indexTs.replace(
  'import { config } from \'./vendure-config\';',
  `import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
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
  plugins: [
    ...(config.plugins || []).map((plugin: any) => {
      if (plugin.constructor.name === 'AdminUiPlugin') {
        return AdminUiPlugin.init({
          route: 'admin',
          port: 3002,
          adminUiConfig: {
            apiPort: 3000,
          },
        });
      }
      return plugin;
    }),
  ],
};`
);

indexTs = indexTs.replace(
  'runMigrations(config)',
  'runMigrations(exampleConfig)'
);

indexTs = indexTs.replace(
  'bootstrap(config)',
  'bootstrap(exampleConfig)'
);

fs.writeFileSync(indexTsPath, indexTs);

const workerTsPath = path.join(exampleDir, 'src', 'index-worker.ts');
let workerTs = fs.readFileSync(workerTsPath, 'utf8');

workerTs = workerTs.replace(
  'import { config } from \'./vendure-config\';',
  `import { config } from './vendure-config';
import { VendureConfig } from '@vendure/core';
import path from 'path';

const exampleConfig: VendureConfig = {
  ...config,
  dbConnectionOptions: {
    type: 'better-sqlite3',
    synchronize: true,
    logging: false,
    database: path.join(__dirname, '../${storeName}.sqlite'),
  },
};`
);

workerTs = workerTs.replace(
  'bootstrapWorker(config)',
  'bootstrapWorker(exampleConfig)'
);

fs.writeFileSync(workerTsPath, workerTs);

const configPath = path.join(exampleDir, 'src', 'vendure-config.ts');
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

fs.writeFileSync(configPath, configContent);

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