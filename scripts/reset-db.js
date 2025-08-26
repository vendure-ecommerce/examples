#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function resetDatabase() {
  console.log('🚨 WARNING: This will destroy all data in the PostgreSQL database!');
  console.log('This action is irreversible and will:');
  console.log('  - Drop all tables and data');
  console.log('  - Reset the database to a clean state');
  console.log('  - Require running migrations again');
  console.log('');
  
  const confirm = await askQuestion('Are you sure you want to continue? (yes/no): ');
  
  if (confirm !== 'yes' && confirm !== 'y') {
    console.log('❌ Reset cancelled');
    rl.close();
    return;
  }
  
  const doubleConfirm = await askQuestion('Type "RESET" to confirm: ');
  
  if (doubleConfirm !== 'reset') {
    console.log('❌ Reset cancelled - confirmation text did not match');
    rl.close();
    return;
  }
  
  rl.close();
  
  try {
    console.log('🐳 Stopping Docker containers...');
    execSync('npm run docker:down', { stdio: 'inherit' });
    
    console.log('🗑️  Removing database volumes...');
    execSync('docker volume rm vendure-examples_postgres_data vendure-examples_redis_data || true', { stdio: 'inherit' });
    
    console.log('🐳 Starting fresh Docker containers...');
    execSync('npm run docker:up', { stdio: 'inherit' });
    
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Database reset complete!');
    console.log('📝 Next steps:');
    console.log('  1. Run migrations: npm run migrate-db');
    console.log('  2. Or start an example: cd examples/shop-github-auth && npm run dev');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase();