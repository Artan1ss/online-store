// Script to deploy database schema to Supabase
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env.production exists
if (!fs.existsSync(path.join(process.cwd(), '.env.production'))) {
  console.error('Error: .env.production file not found!');
  console.error('Please create this file with your Supabase DATABASE_URL');
  process.exit(1);
}

console.log('🚀 Starting database deployment to Supabase...');

try {
  // Load production environment variables
  require('dotenv').config({ path: '.env.production' });
  
  // Generate Prisma client with production DB connection
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Deploy the schema to Supabase
  console.log('🏗️  Pushing schema to Supabase...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Seed the database if needed (optional)
  const seedPrompt = `
Do you want to seed the database with initial data? (y/n): `;
  
  process.stdout.write(seedPrompt);
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    
    if (answer === 'y' || answer === 'yes') {
      console.log('🌱 Seeding database...');
      try {
        execSync('npx prisma db seed', { stdio: 'inherit' });
        console.log('✅ Database seeded successfully!');
      } catch (error) {
        console.error('❌ Error seeding database:', error.message);
      }
    }
    
    console.log('✅ Database deployment complete!');
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ Error deploying database:', error.message);
  process.exit(1);
} 