#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function migrateDatabase(exampleName) {
  const exampleDir = path.join(__dirname, '..', 'examples', exampleName);
  
  if (!fs.existsSync(exampleDir)) {
    console.error(`Example '${exampleName}' not found`);
    process.exit(1);
  }

  console.log(`🗃️  Running database migrations for: ${exampleName}`);
  
  try {
    // Check if Docker services are running
    console.log('🐳 Checking Docker services...');
    execSync('docker ps | grep vendure-postgres', { stdio: 'pipe' });
    execSync('docker ps | grep vendure-redis', { stdio: 'pipe' });
    console.log('✅ Docker services are running');
    
    // Run migrations
    console.log('🔄 Running migrations...');
    execSync('npm run migrate', {
      cwd: exampleDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
    
    console.log(`✅ Database migration completed for: ${exampleName}`);
    
  } catch (error) {
    if (error.message.includes('vendure-postgres') || error.message.includes('vendure-redis')) {
      console.error('❌ Docker services not running. Start them with: npm run docker:up');
    } else {
      console.error(`❌ Migration failed for ${exampleName}:`, error.message);
    }
    process.exit(1);
  }
}

async function migrateAllExamples() {
  const examplesDir = path.join(__dirname, '..', 'examples');
  
  if (!fs.existsSync(examplesDir)) {
    console.error('Examples directory not found');
    process.exit(1);
  }
  
  const examples = fs.readdirSync(examplesDir)
    .filter(item => fs.statSync(path.join(examplesDir, item)).isDirectory());
  
  console.log(`🗃️  Running database migrations for all examples: ${examples.join(', ')}`);
  
  for (const example of examples) {
    try {
      await migrateDatabase(example);
    } catch (error) {
      console.error(`Failed to migrate ${example}, continuing with others...`);
    }
  }
  
  console.log('🎉 All migrations completed!');
}

// Script execution
const exampleName = process.argv[2];

if (!exampleName) {
  console.log('Usage: npm run migrate-db [example-name]');
  console.log('  example-name: specific example to migrate (optional)');
  console.log('  If no example specified, migrates all examples');
  console.log('');
  console.log('Examples:');
  console.log('  npm run migrate-db shop-github-auth');
  console.log('  npm run migrate-db  # migrates all examples');
  
  migrateAllExamples();
} else {
  migrateDatabase(exampleName);
}