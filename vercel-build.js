// Vercel build script for debugging environment variables
const fs = require('fs');
const path = require('path');

console.log('================ VERCEL BUILD DEBUG ================');
console.log('Current working directory:', process.cwd());
console.log('Environment variables available:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV || 'not set');
console.log('- REACT_APP_GEMINI_API_KEY exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
console.log('- process.env keys:', Object.keys(process.env)
  .filter(key => !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('KEY'))
  .join(', '));
console.log('====================================================');

// Create a debug file that will be included in the build
const debugContent = `
// Debug information from build time
window.BUILD_DEBUG = {
  buildTime: "${new Date().toISOString()}",
  nodeEnv: "${process.env.NODE_ENV || 'not set'}",
  vercelEnv: "${process.env.VERCEL_ENV || 'not set'}",
  reactAppApiKeyExists: ${!!process.env.REACT_APP_GEMINI_API_KEY}
};
`;

fs.writeFileSync(path.join(__dirname, 'public', 'build-debug.js'), debugContent);
console.log('Debug information written to public/build-debug.js');
