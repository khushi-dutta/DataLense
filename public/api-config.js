// This script runs before the React app loads
// It checks for environment variables or existing API keys in localStorage

(function() {
  const GEMINI_API_KEY_STORAGE_KEY = 'datalense_gemini_api_key';
  
  // Check if the API key is already in localStorage
  const existingApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  
  console.log('API Key Debug Info:');
  console.log('- ENV_GEMINI_API_KEY exists:', !!window.ENV_GEMINI_API_KEY);
  console.log('- ENV_GEMINI_API_KEY value:', window.ENV_GEMINI_API_KEY ? 
    (window.ENV_GEMINI_API_KEY === '%REACT_APP_GEMINI_API_KEY%' ? 'placeholder not replaced' : 'proper value set') : 'not set');
  console.log('- localStorage API key exists:', !!existingApiKey);
  
  // If there's an API key defined by the environment and it's not the placeholder, use it
  if (window.ENV_GEMINI_API_KEY && window.ENV_GEMINI_API_KEY !== '%REACT_APP_GEMINI_API_KEY%' && window.ENV_GEMINI_API_KEY !== 'your_api_key_here') {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, window.ENV_GEMINI_API_KEY);
    console.log('✓ API key loaded from environment variables');
  } else if (existingApiKey) {
    console.log('✓ Using existing API key from localStorage');
  } else {
    console.log('✗ No API key found. User may need to enter one');
    console.log('To set API key:', {
      'In Vercel': 'Add REACT_APP_GEMINI_API_KEY env var in project settings',
      'For Development': 'Create .env.local with REACT_APP_GEMINI_API_KEY=your_key' 
    });
  }
})();
