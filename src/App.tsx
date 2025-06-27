import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Snackbar, 
  Alert,
  PaletteMode,
  Container,
  Box,
  Link,
  Typography
} from '@mui/material';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ChartDisplay from './components/ChartDisplay';
import AIInsights from './components/AIInsights';
import ExportAllButton from './components/ExportAllButton';
import { analyzeData } from './services/dataAnalysisService';

// Local storage keys
const THEME_STORAGE_KEY = 'datalense_theme_preference';

// Define data type
export interface DataItem {
  [key: string]: string | number;
}

function App() {
  // State for theme mode
  const [mode, setMode] = useState<PaletteMode>('light');
  
  // State for parsed data
  const [data, setData] = useState<DataItem[]>([]);
  
  // State for selected chart type
  const [chartType, setChartType] = useState<string>('bar');
  
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for AI insights
  const [insights, setInsights] = useState<string[]>([]);
  
  // State for error messaging
  const [error, setError] = useState<string | null>(null);
  
  // Refs for chart and insights components (for export functionality)
  const chartRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  
  // Load theme preference and set API key on component mount
  useEffect(() => {
    // Load theme preference
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setMode(storedTheme);
    }
    
    // Initialize the Gemini API key
    import('./services/geminiService').then(({ getGeminiAPIKey, testGeminiAPIKey }) => {
      const apiKey = getGeminiAPIKey();
      
      if (apiKey) {
        console.log("API key found");
        
        // Test the API key
        testGeminiAPIKey(apiKey).then(isValid => {
          console.log("API key validation result:", isValid ? "Valid" : "Invalid");
          if (!isValid) {
            setError("AI features may be limited. There was an issue with the API key configuration.");
          }
        });
      } else {
        setError("No API key found. Some features may be limited.");
      }
    });
  }, []);
  
  // Create a theme instance based on the current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: mode === 'dark' ? '#f48fb1' : '#f50057',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f7',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
      typography: {
        fontFamily: [
          'Roboto',
          '"Segoe UI"',
          'Arial',
          'sans-serif'
        ].join(','),
      },
      shape: {
        borderRadius: 8,
      },
    }),
  [mode]);

  // Toggle theme mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  // Handler for when data is uploaded and parsed
  const handleDataParsed = (parsedData: DataItem[]) => {
    setData(parsedData);
    // Set default selected columns when data is loaded
    if (parsedData.length > 0) {
      const columns = Object.keys(parsedData[0]);
      // Select first column and first numeric column by default
      const firstColumn = columns[0];
      const numericColumn = columns.find(col => 
        typeof parsedData[0][col] === 'number' || !isNaN(Number(parsedData[0][col]))
      ) || columns[0];
      
      setSelectedColumns([firstColumn, numericColumn]);
    }
    // Generate insights when data is loaded
    generateInsights(parsedData);
  };

  // Generate insights from data
  const generateInsights = async (dataToAnalyze: DataItem[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!dataToAnalyze || dataToAnalyze.length === 0) {
        throw new Error('No data available for analysis');
      }
      
      // Get insights using our local data analysis service
      const generatedInsights = await analyzeData(dataToAnalyze);
      
      if (!generatedInsights || generatedInsights.length === 0) {
        throw new Error('No insights were generated');
      }
      
      setInsights(generatedInsights);
    } catch (err) {
      console.error('Error generating insights:', err);
      
      let errorMessage = 'Failed to generate insights. Using sample insights instead.';
      
      setError(errorMessage);
      
      // Fallback to sample insights
      const fallbackInsights = [
        "Your data shows patterns that may indicate seasonal trends.",
        "There appears to be a correlation between the primary variables in your dataset.",
        "The highest values in your dataset may represent potential outliers worth investigating.",
        "Consider normalizing your data for more effective comparisons between variables.",
        "The distribution of your data suggests opportunities for further analysis."
      ];
      
      setInsights(fallbackInsights);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh insights handler
  const handleRefreshInsights = () => {
    if (data.length > 0) {
      generateInsights(data);
    }
  };
  
  // Close error handler
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header 
          currentTheme={mode} 
          onToggleTheme={toggleTheme}
        />
        
        <Container 
          maxWidth="lg" 
          sx={{ 
            pt: 3, 
            pb: 5, 
            flex: 1,
          }}
        >
          <FileUpload onDataParsed={handleDataParsed} setIsLoading={setIsLoading} />
          
          {data.length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <ExportAllButton 
                  data={data} 
                  insights={insights} 
                  chartRef={chartRef} 
                  insightsRef={insightsRef} 
                />
              </Box>
              
              <Box ref={chartRef} sx={{ mb: 3 }}>
                <ChartDisplay 
                  data={data} 
                  chartType={chartType} 
                  setChartType={setChartType} 
                  selectedColumns={selectedColumns}
                />
              </Box>
              
              <Box ref={insightsRef}>
                <AIInsights 
                  insights={insights} 
                  isLoading={isLoading} 
                  onRefresh={handleRefreshInsights}
                  data={data}
                />
              </Box>
            </>
          )}
        </Container>
        
        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 2, 
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Made with ❤️ by{' '}
            <Link 
              href="https://www.linkedin.com/in/khushidutta/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Khushi Dutta
            </Link>
          </Typography>
        </Box>
        
        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default App;
