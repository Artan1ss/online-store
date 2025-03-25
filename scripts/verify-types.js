#!/usr/bin/env node

/**
 * This script runs type checking in a way that simulates the Vercel build process.
 * It helps catch type errors that might appear on Vercel but not in local development.
 */

const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t };

console.log(chalk.blue('🔍 Starting type verification...'));

try {
  // Run ESLint
  console.log(chalk.blue('Running ESLint...'));
  execSync('npx eslint "src/**/*.{ts,tsx}"', { stdio: 'inherit' });
  console.log(chalk.green('✅ ESLint passed!'));
} catch (error) {
  console.log(chalk.yellow('⚠️ ESLint found issues. These might not prevent deployment but should be fixed.'));
}

try {
  // Run TypeScript with stricter checks (simulating Vercel's build process)
  console.log(chalk.blue('Running TypeScript compiler checks...'));
  
  // We use --noEmit to just check types without generating output files
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  
  console.log(chalk.green('✅ TypeScript checks passed! Your code should build successfully on Vercel.'));
} catch (error) {
  console.log(chalk.red('❌ TypeScript checks failed! These errors will likely appear on Vercel.'));
  console.log(chalk.yellow('Please fix the type errors before deploying to Vercel.'));
  process.exit(1);
}

// Simulate a Next.js build
try {
  console.log(chalk.blue('Simulating Next.js build...'));
  // We use --no-lint because we've already run ESLint
  execSync('npx next build --no-lint', { stdio: 'inherit' });
  console.log(chalk.green('✅ Next.js build successful! Your app should deploy correctly on Vercel.'));
} catch (error) {
  console.log(chalk.red('❌ Next.js build failed! Your app will likely fail to deploy on Vercel.'));
  process.exit(1);
} 