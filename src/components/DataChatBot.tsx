import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { queryChatBot } from '../services/geminiService';
import { DataItem } from '../App';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface DataChatBotProps {
  data: DataItem[];
}

const DataChatBot: React.FC<DataChatBotProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          text: "Hello! I'm your data assistant. Ask me anything about your uploaded data and I'll help you analyze it.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: Message = {
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Add a waiting message to show activity
      const waitingMessage: Message = {
        text: "Analyzing your data...",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, waitingMessage]);
      
      const response = await queryChatBot(userMessage.text, data);
      
      // Replace the waiting message with the actual response
      setMessages(prev => prev.slice(0, prev.length - 1).concat({
        text: response,
        isUser: false,
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error querying chatbot:', error);
      
      // Replace the waiting message with an error message
      setMessages(prev => prev.slice(0, prev.length - 1).concat({
        text: "I encountered an issue analyzing your data. Let me provide a basic response: Your data contains " +
              `${data.length} rows with columns: ${Object.keys(data[0] || {}).join(', ')}. ` + 
              "For more specific insights, you might need to try a different question or check the API configuration.",
        isUser: false,
        timestamp: new Date()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToyIcon 
            sx={{ 
              mr: 1.5, 
              color: 'primary.main',
              fontSize: 24
            }} 
          />
          <Typography 
            variant="subtitle1" 
            component="h3" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Data Chat Assistant
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        mb: 2,
        px: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex',
              alignItems: 'flex-start',
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {!message.isUser && (
              <Avatar 
                sx={{ 
                  mr: 1, 
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32
                }}
              >
                <SmartToyIcon fontSize="small" />
              </Avatar>
            )}
            
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: message.isUser ? 'primary.main' : 'background.default',
                color: message.isUser ? 'white' : 'text.primary',
                wordBreak: 'break-word'
              }}
            >
              <Typography variant="body2">{message.text}</Typography>
            </Paper>
            
            {message.isUser && (
              <Avatar 
                sx={{ 
                  ml: 1, 
                  bgcolor: 'grey.400',
                  width: 32,
                  height: 32
                }}
              >
                <PersonIcon fontSize="small" />
              </Avatar>
            )}
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Avatar 
              sx={{ 
                mr: 1, 
                bgcolor: 'primary.main',
                width: 32,
                height: 32
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Thinking...</Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input Area */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Ask about your data..."
          value={inputText}
          onChange={handleInputChange}
          disabled={isLoading}
          sx={{ mr: 1 }}
        />
        <Tooltip title="Send message">
          <IconButton 
            color="primary" 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            sx={{
              width: 40,
              height: 40
            }}
          >
            <SendIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default DataChatBot;
