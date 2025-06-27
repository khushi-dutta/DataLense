import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Button,
  Skeleton
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { DataItem } from '../App';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ChartDisplayProps {
  data: DataItem[] | null;
  chartType?: string;
  setChartType: (type: string) => void;
  selectedColumns: string[];
  isLoading?: boolean;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ data, chartType = 'bar', setChartType, selectedColumns, isLoading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedXAxis, setSelectedXAxis] = useState<string>('');
  const [valuableKeys, setValuableKeys] = useState<string[]>([]);

  const CHART_TYPES = [
    { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon /> },
    { value: 'line', label: 'Line Chart', icon: <TimelineIcon /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon /> },
    { value: 'scatter', label: 'Scatter Chart', icon: <ScatterPlotIcon /> },
    { value: 'area', label: 'Area Chart', icon: <AreaChartIcon /> },
    { value: 'radar', label: 'Radar Chart', icon: <DonutLargeIcon /> }
  ];

  const COLORS = [
    '#1976d2', '#42a5f5', '#64b5f6', '#90caf9', 
    '#26a69a', '#4db6ac', '#80cbc4', '#b2dfdb',
    '#f44336', '#ef5350', '#e57373', '#ef9a9a',
    '#ff9800', '#ffb74d', '#ffcc80', '#ffe0b2',
    '#9c27b0', '#ab47bc', '#ba68c8', '#ce93d8',
    '#8bc34a', '#9ccc65', '#aed581', '#c5e1a5'
  ];

  useEffect(() => {
    if (data && data.length > 0) {
      // Extract all keys from the first data item
      const allKeys = Object.keys(data[0]);
      setKeys(allKeys);
      
      // Find keys with numeric values (for y-axis)
      const numericKeys = allKeys.filter(key => {
        return typeof data[0][key] === 'number' || !isNaN(Number(data[0][key]));
      });
      setValuableKeys(numericKeys);
      
      // Set default X-axis key (non-numeric if possible)
      const nonNumericKeys = allKeys.filter(key => !numericKeys.includes(key));
      if (nonNumericKeys.length > 0) {
        setSelectedXAxis(nonNumericKeys[0]);
      } else {
        setSelectedXAxis(allKeys[0]);
      }
      
      // Prepare chart data
      setChartData(data);
    }
  }, [data]);

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value);
  };

  const handleXAxisChange = (event: SelectChangeEvent) => {
    setSelectedXAxis(event.target.value);
  };

  const exportChartAsPDF = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: isDark ? '#121212' : '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
        });
        
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.setFillColor(isDark ? 18 : 255, isDark ? 18 : 255, isDark ? 18 : 255);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Add title and info
        pdf.setTextColor(isDark ? 200 : 0, isDark ? 200 : 0, isDark ? 200 : 0);
        pdf.setFontSize(16);
        pdf.text(`DataToChart - ${CHART_TYPES.find(c => c.value === chartType)?.label || 'Chart'}`, 10, imgHeight + 20);
        
        pdf.setFontSize(10);
        const today = new Date();
        pdf.text(`Exported on ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 10, imgHeight + 30);
        
        pdf.save(`datachart_${chartType}_${today.getTime()}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  const renderChartTypeButton = (type: string, label: string, icon: React.ReactNode) => (
    <Paper
      elevation={chartType === type ? 4 : 1}
      sx={{
        cursor: 'pointer',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: chartType === type 
          ? `2px solid ${theme.palette.primary.main}` 
          : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        backgroundColor: chartType === type 
          ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08) 
          : theme.palette.background.paper,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: chartType === type 
            ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08) 
            : alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
        }
      }}
      onClick={() => setChartType(type)}
    >
      <Box sx={{ 
        color: chartType === type ? theme.palette.primary.main : 'text.secondary',
        p: 1,
        filter: chartType === type && isDark ? 'drop-shadow(0 0 3px rgba(144, 202, 249, 0.5))' : 'none'
      }}>
        {icon}
      </Box>
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: chartType === type ? 'bold' : 'normal',
          color: chartType === type ? theme.palette.primary.main : 'text.secondary',
        }}
      >
        {label}
      </Typography>
    </Paper>
  );

  // Chart options with animations enabled
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e0e0e0' : '#333333',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#e0e0e0' : '#666666',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'polarArea' ? {
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDark ? '#e0e0e0' : '#666666'
        }
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDark ? '#e0e0e0' : '#666666'
        }
      }
    } : {}
  };

  // Render appropriate chart based on chart type
  const renderChart = () => {
    if (isLoading) {
      return (
        <Box sx={{ width: '100%', height: 400 }}>
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave" 
            sx={{ borderRadius: 2 }}
          />
        </Box>
      );
    }

    if (!data || !selectedColumns || selectedColumns.length === 0 || !selectedXAxis || valuableKeys.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400,
          flexDirection: 'column',
          p: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.4),
          borderRadius: 2
        }}>
          <BarChartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            {!selectedColumns || selectedColumns.length === 0 ? 
              'Please select columns to visualize' : 
              'Upload data to display charts'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {!selectedColumns || selectedColumns.length === 0 ? 
              'Use the column selector to choose data fields for visualization' : 
              'Select a CSV or Excel file to visualize your data in beautiful charts.'}
          </Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <XAxis dataKey={selectedXAxis} stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <ChartTooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
              {valuableKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <XAxis dataKey={selectedXAxis} stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <ChartTooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
              {valuableKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]} 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        // For pie chart, we need to transform the data
        const formattedPieData = chartData.map(item => ({
          name: item[selectedXAxis],
          value: typeof item[valuableKeys[0]] === 'number' ? 
                 item[valuableKeys[0]] : 
                 parseFloat(item[valuableKeys[0]]) || 0
        }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={formattedPieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {formattedPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <XAxis 
                type="number" 
                dataKey={valuableKeys[0]} 
                name={valuableKeys[0]} 
                stroke={theme.palette.text.secondary}
              />
              <YAxis 
                type="number" 
                dataKey={valuableKeys.length > 1 ? valuableKeys[1] : valuableKeys[0]} 
                name={valuableKeys.length > 1 ? valuableKeys[1] : valuableKeys[0]} 
                stroke={theme.palette.text.secondary}
              />
              <ChartTooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Scatter 
                name={selectedXAxis} 
                data={chartData} 
                fill={COLORS[0]} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <XAxis dataKey={selectedXAxis} stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <ChartTooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
              {valuableKeys.map((key, index) => (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  fill={alpha(COLORS[index % COLORS.length], 0.6)} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <PolarAngleAxis dataKey={selectedXAxis} stroke={theme.palette.text.secondary} />
              <PolarRadiusAxis stroke={theme.palette.text.secondary} />
              {valuableKeys.map((key, index) => (
                <Radar 
                  key={key} 
                  name={key} 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]} 
                  fill={alpha(COLORS[index % COLORS.length], 0.6)} 
                  fillOpacity={0.6} 
                />
              ))}
              <Legend />
              <ChartTooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                  color: theme.palette.text.primary,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <Typography>Unsupported chart type</Typography>
        );
    }
  };

  return (
    <div>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.1)' : '#fff',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`
        }}>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.primary.main
            }}
          >
            Data Visualization
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              onChange={handleChartTypeChange}
              label="Chart Type"
            >
              {CHART_TYPES.map(chartTypeOption => (
                <MenuItem key={chartTypeOption.value} value={chartTypeOption.value}>{chartTypeOption.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box 
          ref={chartRef} 
          sx={{ 
            backgroundColor: alpha(theme.palette.background.default, 0.4),
            p: 2,
            borderRadius: 2,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
          data-chart-type={chartType}
        >
          <div key={chartType}>
            {renderChart()}
          </div>
        </Box>
        
        <Box sx={{ 
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
          textAlign: 'center'
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontStyle: 'italic',
              display: 'block'
            }}
          >
            {selectedColumns.length > 0 ? (
              <>
                Displaying {chartType} chart for {selectedColumns.join(', ')}
                {chartType === 'scatter' && ' (x vs y)'}
              </>
            ) : (
              'Select columns to visualize'
            )}
          </Typography>
        </Box>
      </Paper>
    </div>
  );
};

export default ChartDisplay; 