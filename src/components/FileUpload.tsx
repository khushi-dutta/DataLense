import React, { useState, useRef } from 'react';
import { 
  Typography, 
  Button, 
  Box, 
  Paper, 
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataItem } from '../App';

interface FileUploadProps {
  onDataParsed: (data: DataItem[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed, setIsLoading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeUploadType, setActiveUploadType] = useState<string>('file');
  const [fileName, setFileName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState<boolean>(false);
  const [pasteContent, setPasteContent] = useState<string>('');

  // Handle CSV file parsing
  const handleCSVFile = (file: File) => {
    setIsProcessing(true);
    setIsSuccess(false);
    setIsError(false);
    
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<DataItem>) => {
        if (results.data && results.data.length > 0) {
          onDataParsed(results.data);
          setUploadStatus('File uploaded and processed successfully!');
          setIsSuccess(true);
        } else {
          setUploadStatus('Error: Could not parse CSV data.');
          setIsError(true);
        }
        setIsProcessing(false);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        setUploadStatus('Error: Could not parse CSV file.');
        setIsError(true);
        setIsProcessing(false);
      }
    });
  };

  // Handle Excel file parsing
  const handleExcelFile = (file: File) => {
    setIsProcessing(true);
    setIsSuccess(false);
    setIsError(false);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet) as DataItem[];
        
        if (parsedData && parsedData.length > 0) {
          onDataParsed(parsedData);
          setUploadStatus('Excel file processed successfully!');
          setIsSuccess(true);
        } else {
          setUploadStatus('Error: Could not extract data from Excel file.');
          setIsError(true);
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setUploadStatus('Error: Could not parse Excel file.');
        setIsError(true);
      }
      setIsProcessing(false);
    };
    
    reader.onerror = () => {
      setUploadStatus('Error: Could not read file.');
      setIsError(true);
      setIsProcessing(false);
    };
    
    reader.readAsBinaryString(file);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setFileName(file.name);
    
    // Process based on file type
    if (file.name.endsWith('.csv')) {
      handleCSVFile(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      handleExcelFile(file);
    } else {
      setUploadStatus('Error: Unsupported file format. Please upload CSV or Excel files.');
      setIsError(true);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Paste data handler
  const handlePasteData = () => {
    setPasteDialogOpen(true);
  };

  // Process pasted data
  const processPastedData = () => {
    if (!pasteContent.trim()) {
      setPasteDialogOpen(false);
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);
    setIsError(false);
    setPasteDialogOpen(false);
    
    try {
      // Try to parse as CSV first
      Papa.parse(pasteContent, {
        header: true,
        complete: (results: Papa.ParseResult<DataItem>) => {
          if (results.data && results.data.length > 0) {
            onDataParsed(results.data);
            setUploadStatus('Pasted data processed successfully!');
            setIsSuccess(true);
          } else {
            setUploadStatus('Error: Could not parse pasted data.');
            setIsError(true);
          }
          setIsProcessing(false);
        },
        error: () => {
          // If CSV parsing fails, try JSON
          try {
            const jsonData = JSON.parse(pasteContent);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              onDataParsed(jsonData);
              setUploadStatus('Pasted JSON data processed successfully!');
              setIsSuccess(true);
            } else {
              setUploadStatus('Error: Invalid data format. Please paste valid CSV or JSON.');
              setIsError(true);
            }
          } catch (e) {
            setUploadStatus('Error: Could not parse pasted data. Please ensure it\'s valid CSV or JSON.');
            setIsError(true);
          }
          setIsProcessing(false);
        }
      });
    } catch (error) {
      setUploadStatus('Error: Could not process pasted data.');
      setIsError(true);
      setIsProcessing(false);
    }
  };

  // Paper component style based on active state
  const getPaperStyle = (type: string) => {
    const isActive = activeUploadType === type;
    return {
      padding: 3,
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      borderRadius: 2,
      border: isActive ? `2px solid ${theme.palette.primary.main}` : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
      backgroundColor: isActive 
        ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08) 
        : theme.palette.background.paper,
      boxShadow: isActive 
        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` 
        : 'none',
      transform: isActive ? 'translateY(-4px)' : 'none',
      '&:hover': {
        backgroundColor: isActive 
          ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08) 
          : alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
        transform: 'translateY(-4px)',
        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`
      }
    };
  };

  // Get action button style
  const getActionButtonStyle = () => {
    return {
      borderRadius: '24px',
      padding: '10px 24px',
      fontWeight: 'bold',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
      }
    };
  };

  return (
    <Box sx={{ 
      padding: 3,
      borderRadius: 2,
      boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Typography 
        variant="h5" 
        component="h2" 
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 3,
          background: isDark 
            ? 'linear-gradient(45deg, #90caf9 30%, #64b5f6 90%)' 
            : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Upload Your Data
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 45%' } }}>
          <Paper 
            onClick={() => setActiveUploadType('file')}
            sx={getPaperStyle('file')}
            elevation={activeUploadType === 'file' ? 4 : 0}
          >
            <CloudUploadIcon sx={{ 
              fontSize: 52, 
              color: theme.palette.primary.main, 
              mb: 2,
              filter: isDark ? 'drop-shadow(0 0 8px rgba(144, 202, 249, 0.4))' : 'none'
            }} />
            <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
              Upload File
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Upload CSV or Excel files from your device
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 45%' } }}>
          <Paper 
            onClick={() => setActiveUploadType('paste')}
            sx={getPaperStyle('paste')}
            elevation={activeUploadType === 'paste' ? 4 : 0}
          >
            <ArticleIcon sx={{ 
              fontSize: 52, 
              color: theme.palette.primary.main, 
              mb: 2,
              filter: isDark ? 'drop-shadow(0 0 8px rgba(144, 202, 249, 0.4))' : 'none'
            }} />
            <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
              Paste Data
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Paste data from clipboard or enter manually
            </Typography>
          </Paper>
        </Box>
      </Box>
      
      <Divider sx={{ 
        my: 4, 
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        '&::before, &::after': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        }
      }} />
      
      <Box sx={{ 
        mt: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.03),
        borderRadius: 2,
        padding: 4,
      }}>
        {activeUploadType === 'file' && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={triggerFileInput}
              disabled={isProcessing}
              size="large"
              sx={getActionButtonStyle()}
            >
              {isProcessing ? 'Processing...' : 'Select File'}
            </Button>
            {fileName && (
              <Box sx={{ 
                mt: 3, 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px 16px',
                backgroundColor: isDark ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.background.paper, 0.7),
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                maxWidth: '100%',
                overflow: 'hidden',
              }}>
                <ArticleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fileName}
                </Typography>
              </Box>
            )}
          </>
        )}
        
        {activeUploadType === 'paste' && (
          <Button
            variant="contained"
            startIcon={<ArticleIcon />}
            onClick={handlePasteData}
            disabled={isProcessing}
            size="large"
            sx={getActionButtonStyle()}
          >
            {isProcessing ? 'Processing...' : 'Paste Data'}
          </Button>
        )}
        
        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={36} />
          </Box>
        )}
        
        {uploadStatus && (
          <Box sx={{ 
            mt: 3, 
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isSuccess 
              ? (isDark ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.success.main, 0.05))
              : (isDark ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.error.main, 0.05)),
            border: `1px solid ${isSuccess 
              ? alpha(theme.palette.success.main, 0.3)
              : alpha(theme.palette.error.main, 0.3)}`
          }}>
            {isSuccess ? (
              <CheckCircleIcon color="success" sx={{ mr: 1.5 }} />
            ) : (
              <ErrorIcon color="error" sx={{ mr: 1.5 }} />
            )}
            <Typography 
              variant="body1" 
              sx={{ 
                color: isSuccess ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 500
              }}
            >
              {uploadStatus}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add the paste dialog */}
      <Dialog 
        open={pasteDialogOpen} 
        onClose={() => setPasteDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Paste Your Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste CSV or JSON data. Make sure the first row contains column headers if using CSV.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={10}
            variant="outlined"
            fullWidth
            placeholder="Paste your data here..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasteDialogOpen(false)}>Cancel</Button>
          <Button onClick={processPastedData} variant="contained">Process Data</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload; 