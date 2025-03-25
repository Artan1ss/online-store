module.exports = {
  // Run ESLint on JS, TS, and TSX files
  '**/*.{js,ts,tsx}': ['eslint --fix'],
  
  // Run Prettier on various file types
  '**/*.{js,ts,tsx,json,md,css,scss}': ['prettier --write'],
} 