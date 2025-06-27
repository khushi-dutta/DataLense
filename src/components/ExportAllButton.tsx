import React from 'react';
import { 
  Button, 
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DataItem } from '../App';

interface ExportAllButtonProps {
  data: DataItem[];
  insights: string[];
  chartRef: React.RefObject<HTMLDivElement | null>;
  insightsRef: React.RefObject<HTMLDivElement | null>;
}

const ExportAllButton: React.FC<ExportAllButtonProps> = ({ 
  data, 
  insights, 
  chartRef, 
  insightsRef 
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportAllData = async () => {
    if (!chartRef.current || !insightsRef.current || !data || data.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('DataLense Report', pdfWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, 27, { align: 'center' });
      
      // Add chart
      const chartCanvas = await html2canvas(chartRef.current);
      const chartImgData = chartCanvas.toDataURL('image/png');
      
      const imgWidth = pdfWidth - (2 * margin);
      const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
      
      pdf.addImage(chartImgData, 'PNG', margin, 35, imgWidth, imgHeight);
      
      // Add insights
      let yPos = 45 + imgHeight;
      
      pdf.setFontSize(14);
      pdf.text('AI-Generated Insights', pdfWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.setFontSize(11);
      
      insights.forEach((insight, index) => {
        pdf.text(`${index + 1}. ${insight}`, margin, yPos);
        yPos += 10;
      });
      
      // Save the PDF
      pdf.save('data-analysis-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
      onClick={exportAllData}
      disabled={isExporting || !data || data.length === 0}
    >
      {isExporting ? 'Exporting...' : 'Export Report'}
    </Button>
  );
};

export default ExportAllButton;