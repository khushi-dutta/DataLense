import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import InsightsIcon from '@mui/icons-material/Insights';
import ChatIcon from '@mui/icons-material/Chat';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import DataChatBot from './DataChatBot';
import { DataItem } from '../App';

interface AIInsightsProps {
  insights: string[];
  isLoading: boolean;
  onRefresh: () => void;
  data: DataItem[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights, isLoading, onRefresh, data }) => {
  const [showIcon, setShowIcon] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Simple fade-in animation with CSS
  const fadeIn = {
    animation: 'fadeIn 0.5s ease-in-out',
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
        transform: 'translateY(10px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ p: 3 }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InsightsIcon 
            sx={{ 
              mr: 1.5, 
              color: 'primary.main',
              fontSize: 28
            }} 
          />
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            AI-Powered Insights
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Tooltip title="Refresh insights">
            <IconButton 
              onClick={onRefresh} 
              disabled={isLoading}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'rotate(30deg)',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="AI insights tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<InsightsIcon />} 
            label="Insights" 
            id="ai-tab-0"
            aria-controls="ai-tabpanel-0"
          />
          <Tab 
            icon={<ChatIcon />} 
            label="Data Chat" 
            id="ai-tab-1"
            aria-controls="ai-tabpanel-1"
            disabled={data.length === 0}
          />
        </Tabs>
      </Box>
      
      {activeTab === 0 && isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}>
          <Box sx={{ mb: 2 }}>
            <CircularProgress size={40} />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Analyzing your data...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, textAlign: 'center' }}>
            Our AI is looking for patterns, trends, and insights in your dataset
          </Typography>
        </Box>
      ) : activeTab === 0 ? (
        <Box>
          {insights.length > 0 ? (
            <div style={fadeIn as any}>
              {insights.map((insight, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex',
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Box sx={{ 
                    mr: 2, 
                    display: 'flex', 
                    alignItems: 'flex-start'
                  }}>
                    {index === 0 ? (
                      <AutoAwesomeIcon sx={{ color: '#f9a825' }} />
                    ) : index === 1 ? (
                      <ManageHistoryIcon sx={{ color: '#039be5' }} />
                    ) : (
                      <InsightsIcon sx={{ color: '#7cb342' }} />
                    )}
                  </Box>
                  <Typography variant="body1" color="text.primary">
                    {insight}
                  </Typography>
                </Box>
              ))}
            </div>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4
            }}>
              <Typography variant="body1" color="text.secondary">
                No insights available. Upload data to generate insights.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          {data.length > 0 ? (
            <DataChatBot data={data} />
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4
            }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Upload data to start chatting.
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {/* Export Insights button removed */}
    </Paper>
  );
};

export default AIInsights;