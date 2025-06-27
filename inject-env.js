const fs = require('fs');
const path = require('path');

// Read the content of env-config.js
const envConfigPath = path.join(__dirname, 'public', 'env-config.js');
let envConfigContent = fs.readFileSync(envConfigPath, 'utf8');

// Log environment variables for debugging
console.log('Environment Variables Debug:');
console.log('- REACT_APP_GEMINI_API_KEY exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV || 'not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');

// Get API key from environment variables using multiple fallbacks
const apiKeyValue = process.env.REACT_APP_GEMINI_API_KEY || 
                    'your_api_key_here';

const apiKeySource = 
  process.env.REACT_APP_GEMINI_API_KEY ? 'REACT_APP_GEMINI_API_KEY' :
  'default fallback';

console.log('Using API key from:', apiKeySource);
console.log('API key status:', apiKeyValue === 'your_api_key_here' ? 'DEFAULT (no API key found)' : 'VALID KEY FOUND');

// Replace the placeholder with actual environment variable
envConfigContent = envConfigContent.replace('%REACT_APP_GEMINI_API_KEY%', apiKeyValue);

// Write the modified content back
fs.writeFileSync(envConfigPath, envConfigContent);

console.log('Environment variables successfully injected into env-config.js');
