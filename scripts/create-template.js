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
    dev: 'ts-node src/index.ts',
    build: 'tsc',
    start: 'node dist/index.js',
    clean: 'rimraf dist'
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
const indexTs = `import { bootstrap } from 'vendure-main-store';

async function runTemplate() {
  console.log('Starting ${storeName} template store...');
  
  // You can customize the Vendure configuration here
  // or import specific configurations from the main store
  
  const app = await bootstrap({
    // Add your custom configuration here
    // This template inherits from the main store
  });
  
  console.log('${storeName} template store is running on port 3000');
}

if (require.main === module) {
  runTemplate().catch(console.error);
}

export { runTemplate };
`;

fs.writeFileSync(path.join(templateDir, 'src', 'index.ts'), indexTs);

// Create README.md
const readmeMd = `# ${storeName} Template Store

This is a template Vendure store demonstrating specific features or configurations.

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev:template ${storeName}

# Build the template
pnpm build:template ${storeName}
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