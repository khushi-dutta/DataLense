import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  useTheme,
  Box,
  Switch
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BarChartIcon from '@mui/icons-material/BarChart';

interface HeaderProps {
  currentTheme: string;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentTheme, 
  onToggleTheme
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar 
      position="sticky" 
      elevation={1}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 1 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            DataLense
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Brightness7Icon />
          <Switch 
            checked={isDark} 
            onChange={onToggleTheme}
            sx={{ mx: 1 }}
          />
          <Brightness4Icon />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;