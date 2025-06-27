import { DataItem } from '../App';

// Declare global type for window to include our env variable
declare global {
  interface Window {
    ENV_GEMINI_API_KEY?: string;
  }
}

// API key storage key
const GEMINI_API_KEY_STORAGE_KEY = 'datalense_gemini_api_key';

// Store the API key in localStorage
export const storeGeminiAPIKey = (apiKey: string): void => {
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
};

// Get the API key from localStorage or environment
export const getGeminiAPIKey = (): string | null => {
  // Check for Create React App environment variable
  const envApiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  // Check for runtime injected environment variable
  const runtimeApiKey = typeof window !== 'undefined' && window.ENV_GEMINI_API_KEY !== '%REACT_APP_GEMINI_API_KEY%' 
    ? window.ENV_GEMINI_API_KEY 
    : null;
    
  // Check localStorage
  const localStorageApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  
  // Log where we're trying to get the API key from
  console.log('API key sources check:', {
    'CRA ENV': envApiKey ? '✓ found' : '✗ not found',
    'Runtime ENV': runtimeApiKey ? '✓ found' : '✗ not found',
    'localStorage': localStorageApiKey ? '✓ found' : '✗ not found'
  });
  
  // Return the first available API key
  return localStorageApiKey || runtimeApiKey || envApiKey || null;
};

// Query the chatbot with user question about the data
export const queryChatBot = async (question: string, data: DataItem[]): Promise<string> => {
  try {
    const apiKey = getGeminiAPIKey();
    
    if (!apiKey) {
      throw new Error('No API key available');
    }
    
    // Log that we're using the API key (truncated for security)
    console.log(`Using API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    
    // Extract basic info about the data
    const columns = Object.keys(data[0] || {});
    const numericColumns = columns.filter(col => {
      const firstValue = data[0][col];
      return typeof firstValue === 'number' || !isNaN(Number(firstValue));
    });
    const textColumns = columns.filter(col => !numericColumns.includes(col));
    
    // Create a comprehensive data summary for Gemini 1.5 Flash (has higher token limits)
    let dataSummary = `Dataset Summary:
- Total rows: ${data.length}
- Columns: ${columns.join(', ')}
- Numeric columns: ${numericColumns.join(', ')}
- Text columns: ${textColumns.join(', ')}`;
    
    // Add statistics for all numeric columns since Gemini 1.5 can handle more context
    for (const col of numericColumns) {
      if (data.length > 0) {
        const values = data.map(item => Number(item[col])).filter(val => !isNaN(val));
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          // Calculate standard deviation for better statistical insight
          const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          dataSummary += `\n- Column "${col}": min=${min}, max=${max}, avg=${avg.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`;
        }
      }
    }
    
    // Add more sample data (Gemini 1.5 Flash can handle more context)
    const sampleData = JSON.stringify(data.slice(0, 5), null, 2);
    dataSummary += `\n\nSample data (first 5 rows):\n${sampleData}`;
    
    // Create a more detailed prompt optimized for Gemini 1.5 Flash
    const prompt = `You are an expert data analyst helping the user understand their data. 
You have access to the following dataset information:

${dataSummary}

User question: "${question}"

Provide a detailed, informative answer based on the data. Include specific numbers, patterns, and insights when relevant.
If the question requires statistical analysis not provided, explain what analysis would be needed.
Keep your response concise, clear, and focused on answering the specific question.`;
    
    console.log("Sending prompt to Gemini API:", prompt.substring(0, 100) + "...");
    
    // Call the Gemini 1.5 Flash API using fetch
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,            // Lower temperature for more focused responses
            topK: 40,                    // Slightly higher for more diversity
            topP: 0.95,                  // Slightly lower for more focus
            maxOutputTokens: 1024,       // Keeping this moderate for chat responses
          }
        })
      });
      
      console.log("API response status:", response.status);
      
      // Get the response body as text first
      const responseText = await response.text();
      console.log("Raw API response:", responseText.substring(0, 100) + "...");
      
      // Then parse as JSON if possible
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error(`API response was not valid JSON: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        console.error('Gemini API error:', result);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        return result.candidates[0].content.parts[0].text;
      }
      
      // More detailed error for debugging
      console.error('Unexpected response structure:', result);
      throw new Error('Unexpected API response format');
    } catch (apiError) {
      console.error('API call error:', apiError);
      
      // Fallback to basic response about the data
      return `I'm having trouble connecting to the analysis service right now, but I can tell you that your data has ${data.length} rows and the following columns: ${columns.join(', ')}.`;
    }
  } catch (error) {
    console.error('Error querying chatbot:', error);
    throw error;
  }
};

// Remove the API key from localStorage
export const removeGeminiAPIKey = (): void => {
  localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

// Test if the API key is valid by making a simple request to the Gemini API
export const testGeminiAPIKey = async (apiKey: string): Promise<boolean> => {
  try {
    console.log("Testing API key:", apiKey.substring(0, 5) + "...");
    
    // Check if API key has a reasonable format first
    if (apiKey.trim().length < 10) {
      console.log("API key is too short, rejecting");
      return false;
    }
    
    try {
      // Use the models list endpoint to validate the API key
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      console.log("Testing API key with models endpoint");
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("API key test response status:", response.status);
      
      if (!response.ok) {
        console.error('API key test failed with status:', response.status);
        return false;
      }
      
      const result = await response.json();
      console.log("API key is valid, models available:", result.models?.length || 0);
      return true;
    } catch (apiError) {
      console.error('API request error during key test:', apiError);
      
      // Try a fallback way to validate (just assume it's valid if it's the expected format)
      if (apiKey.startsWith('AIza') && apiKey.length > 30) {
        console.log("API request failed but key format looks valid, accepting");
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error testing Gemini API key:', error);
    return false;
  }
};

// Generate AI-powered insights using Gemini API
export const generateGeminiInsights = async (data: DataItem[]): Promise<string[]> => {
  try {
    const apiKey = getGeminiAPIKey();
    
    if (!apiKey) {
      throw new Error('No API key available');
    }
    
    console.log(`Generating insights with API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    
    // Extract information about the data
    const columns = Object.keys(data[0] || {});
    const numericColumns = columns.filter(col => {
      const firstValue = data[0][col];
      return typeof firstValue === 'number' || !isNaN(Number(firstValue));
    });
    const textColumns = columns.filter(col => !numericColumns.includes(col));
    
    // Create a comprehensive data summary for Gemini 1.5 Flash
    let dataSummary = `Dataset Summary:
- Total rows: ${data.length}
- Columns: ${columns.join(', ')}
- Numeric columns: ${numericColumns.join(', ')}
- Text columns: ${textColumns.join(', ')}`;
    
    // Add detailed statistics for all numeric columns since Gemini 1.5 can handle more context
    for (const col of numericColumns) {
      if (data.length > 0) {
        const values = data.map(item => Number(item[col])).filter(val => !isNaN(val));
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          // Calculate standard deviation
          const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          dataSummary += `\n- Column "${col}": min=${min}, max=${max}, avg=${avg.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`;
        }
      }
    }
    
    // Add more sample data (Gemini 1.5 Flash can handle more context)
    const sampleData = JSON.stringify(data.slice(0, 5), null, 2);
    dataSummary += `\n\nSample data (first 5 rows):\n${sampleData}`;
    
    // Define an optimized prompt for Gemini 1.5 Flash
    const prompt = `As an expert data analyst, examine the following dataset and generate 5 high-value insights:

${dataSummary}

For each insight:
1. Focus on significant patterns, correlations, outliers, or trends
2. Be specific with numbers and facts derived from the data
3. Suggest actionable recommendations where relevant
4. Keep each insight to 1-2 sentences for clarity
5. Ensure insights are varied (don't focus on just one aspect of the data)

Format your response as 5 separate insights, one per line, without bullets or numbering.`;

    console.log("Sending insights prompt to Gemini API:", prompt.substring(0, 100) + "...");
    
    try {
      // Call the Gemini 1.5 Flash API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,          // Lower temperature for more focused insights
            topK: 40,                  // Slightly higher for diverse insights
            topP: 0.95,                // Slightly lower for focused results
            maxOutputTokens: 1024,     // Sufficient for insights generation
          }
        })
      });
      
      console.log("API insights response status:", response.status);
      
      // Get the response body as text first for debugging
      const responseText = await response.text();
      console.log("Raw insights API response:", responseText.substring(0, 100) + "...");
      
      // Then parse as JSON if possible
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse insights JSON response:", e);
        throw new Error(`API response was not valid JSON`);
      }
      
      if (!response.ok) {
        console.error('Gemini API insights error:', result);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const text = result.candidates[0].content.parts[0].text;
        // Split the response into separate insights
        const insights = text.split('\n').filter((line: string) => line.trim() !== '');
        return insights.slice(0, 5); // Ensure we have at most 5 insights
      }
      
      throw new Error('Unexpected API response format for insights');
    } catch (apiError) {
      console.error('API insights call error:', apiError);
      
      // Generate fallback insights based on the data
      console.log("Generating fallback insights from data");
      
      // Fallback insights
      const insights: string[] = [];
      
      // Add data info insight
      insights.push(`Your dataset contains ${data.length} rows and ${columns.length} columns including ${columns.join(', ')}.`);
      
      // Add numeric columns insight if available
      if (numericColumns.length > 0) {
        const randomColumn = numericColumns[Math.floor(Math.random() * numericColumns.length)];
        const values = data.map(item => Number(item[randomColumn])). filter(val => !isNaN(val));
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          insights.push(`The "${randomColumn}" column shows a range of values from ${min} to ${max}, suggesting potential trends worth exploring.`);
        }
      }
      
      // Add correlation insight if multiple numeric columns
      if (numericColumns.length > 1) {
        const col1 = numericColumns[0];
        const col2 = numericColumns[1];
        insights.push(`Consider investigating the relationship between "${col1}" and "${col2}" as they may reveal important correlations in your data.`);
      }
      
      // Add general recommendation
      insights.push(`To gain deeper insights, try visualizing your data using different chart types like bar charts, scatter plots, or line graphs.`);
      
      // Add data quality insight
      insights.push(`Regular data validation and cleaning will help ensure accurate analysis results and meaningful insights from your dataset.`);
      
      return insights;
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Final fallback for any unexpected errors
    return [
      "Your data has been processed but insights couldn't be generated automatically.",
      "Try exploring the data visually using the chart options available.",
      "Consider checking for trends and patterns in the numerical columns.",
      "Look for relationships between different variables in your dataset.",
      "Data quality is important - verify your data is clean and consistent for best results."
    ];
  }
};