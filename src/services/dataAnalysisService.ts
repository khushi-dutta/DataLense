import { DataItem } from '../App';

// Function to calculate statistics for numeric values in a column
const calculateStats = (data: DataItem[], key: string) => {
  const numericValues = data
    .map(item => typeof item[key] === 'number' ? item[key] as number : parseFloat(item[key] as string))
    .filter(value => !isNaN(value));
  
  if (numericValues.length === 0) return null;
  
  // Sort values for easier calculations
  numericValues.sort((a, b) => a - b);
  
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericValues.length;
  
  // Calculate median
  const mid = Math.floor(numericValues.length / 2);
  const median = numericValues.length % 2 === 0 
    ? (numericValues[mid - 1] + numericValues[mid]) / 2 
    : numericValues[mid];
  
  // Calculate mode (most frequent value)
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;
  
  numericValues.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  });
  
  // Calculate standard deviation
  const squaredDiffs = numericValues.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / numericValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate min, max, range, and quartiles
  const min = numericValues[0];
  const max = numericValues[numericValues.length - 1];
  const range = max - min;
  
  // Calculate quartiles
  const q1Index = Math.floor(numericValues.length * 0.25);
  const q3Index = Math.floor(numericValues.length * 0.75);
  const q1 = numericValues[q1Index];
  const q3 = numericValues[q3Index];
  const iqr = q3 - q1;
  
  // Define outliers using the 1.5 * IQR rule
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = numericValues.filter(v => v < lowerBound || v > upperBound);
  
  return {
    count: numericValues.length,
    min,
    max,
    range,
    sum,
    mean,
    median,
    mode,
    stdDev,
    q1,
    q3,
    iqr,
    outliers,
    hasOutliers: outliers.length > 0
  };
};

// Check for missing or incomplete data
const findMissingData = (data: DataItem[]) => {
  const columns = Object.keys(data[0] || {});
  const missingData: Record<string, number> = {};
  
  columns.forEach(column => {
    const missing = data.filter(item => 
      item[column] === undefined || 
      item[column] === null || 
      item[column] === '' ||
      (typeof item[column] === 'string' && (item[column] as string).trim() === '')
    ).length;
    
    if (missing > 0) {
      missingData[column] = missing;
    }
  });
  
  return missingData;
};

// Find correlations between numeric columns
const findCorrelations = (data: DataItem[]) => {
  const columns = Object.keys(data[0] || {});
  const numericColumns = columns.filter(col => {
    const stats = calculateStats(data, col);
    return stats !== null && stats.count > 0;
  });
  
  const correlations: Array<{col1: string, col2: string, coefficient: number}> = [];
  
  // Calculate Pearson correlation coefficient for each pair of numeric columns
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const values1 = data.map(item => {
        const val = typeof item[col1] === 'number' 
          ? item[col1] as number 
          : parseFloat(item[col1] as string);
        return isNaN(val) ? null : val;
      }).filter(val => val !== null) as number[];
      
      const values2 = data.map(item => {
        const val = typeof item[col2] === 'number' 
          ? item[col2] as number 
          : parseFloat(item[col2] as string);
        return isNaN(val) ? null : val;
      }).filter(val => val !== null) as number[];
      
      // Only calculate if we have enough matching values
      if (values1.length === values2.length && values1.length > 1) {
        const n = values1.length;
        
        // Calculate means
        const mean1 = values1.reduce((sum, val) => sum + val, 0) / n;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / n;
        
        // Calculate correlation coefficient
        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;
        
        for (let k = 0; k < n; k++) {
          const diff1 = values1[k] - mean1;
          const diff2 = values2[k] - mean2;
          
          numerator += diff1 * diff2;
          denom1 += diff1 * diff1;
          denom2 += diff2 * diff2;
        }
        
        const coefficient = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2));
        
        // Only include meaningful correlations (above 0.5 or below -0.5)
        if (!isNaN(coefficient) && Math.abs(coefficient) > 0.5) {
          correlations.push({ col1, col2, coefficient });
        }
      }
    }
  }
  
  // Sort by absolute correlation value, strongest first
  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
};

// Detect trends in numeric data (new function)
const detectTrends = (data: DataItem[], column: string) => {
  if (data.length < 5) return null;
  
  const values = data.map(item => {
    const val = typeof item[column] === 'number' 
      ? item[column] as number 
      : parseFloat(item[column] as string);
    return isNaN(val) ? null : val;
  }).filter(val => val !== null) as number[];
  
  if (values.length < 5) return null;
  
  // Simple trend detection by comparing consecutive values
  let increases = 0;
  let decreases = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i-1]) increases++;
    else if (values[i] < values[i-1]) decreases++;
  }
  
  const totalChanges = increases + decreases;
  if (totalChanges === 0) return null;
  
  const increasePercent = (increases / totalChanges) * 100;
  const decreasePercent = (decreases / totalChanges) * 100;
  
  if (increasePercent > 60) {
    const growthRate = ((values[values.length-1] / values[0] - 1) * 100);
    return {
      direction: 'upward' as const,
      consistency: increasePercent,
      rate: growthRate
    };
  } else if (decreasePercent > 60) {
    const declineRate = ((1 - values[values.length-1] / values[0]) * 100);
    return {
      direction: 'downward' as const,
      consistency: decreasePercent,
      rate: declineRate
    };
  } else {
    return {
      direction: 'fluctuating' as const,
      upPercent: increasePercent,
      downPercent: decreasePercent
    };
  }
};

// Function to detect seasonality or cyclical patterns (new)
const detectSeasonality = (data: DataItem[], column: string) => {
  if (data.length < 10) return null;
  
  const values = data.map(item => {
    const val = typeof item[column] === 'number' 
      ? item[column] as number 
      : parseFloat(item[column] as string);
    return isNaN(val) ? null : val;
  }).filter(val => val !== null) as number[];
  
  if (values.length < 10) return null;
  
  // Simple pattern detection by looking for repeating up-down sequences
  const directions: string[] = [];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i-1]) {
      directions.push('up');
    } else if (values[i] < values[i-1]) {
      directions.push('down');
    } else {
      directions.push('same');
    }
  }
  
  // Look for patterns of length 2-4
  let maxPatternLength = 0;
  let patternConfidence = 0;
  
  for (let patternLength = 2; patternLength <= 4; patternLength++) {
    if (directions.length < patternLength * 2) continue;
    
    // Count repeating patterns
    let patternMatches = 0;
    
    for (let i = 0; i <= directions.length - (patternLength * 2); i++) {
      let isMatch = true;
      
      for (let j = 0; j < patternLength; j++) {
        if (directions[i + j] !== directions[i + patternLength + j]) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) patternMatches++;
    }
    
    const patternOccurrences = Math.floor(directions.length / patternLength);
    const confidence = patternMatches / (patternOccurrences - 1);
    
    if (confidence > patternConfidence) {
      patternConfidence = confidence;
      maxPatternLength = patternLength;
    }
  }
  
  if (patternConfidence > 0.3) {
    return {
      patternLength: maxPatternLength,
      confidence: patternConfidence
    };
  }
  
  return null;
};

// Generate insights from data
export const analyzeData = async (data: DataItem[]): Promise<string[]> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data available for analysis');
    }
    
    const insights: string[] = [];
    const columns = Object.keys(data[0]);
    
    // Calculate stats for all numeric columns
    const columnStats: Record<string, any> = {};
    const numericColumns: string[] = [];
    
    columns.forEach(column => {
      const stats = calculateStats(data, column);
      if (stats !== null) {
        columnStats[column] = stats;
        numericColumns.push(column);
      }
    });
    
    // 1. Highest values insight with enhanced analysis
    if (numericColumns.length > 0) {
      // Find column with highest max value
      const highestValueColumn = numericColumns.reduce((highest, column) => 
        columnStats[column].max > columnStats[highest].max ? column : highest, 
        numericColumns[0]
      );
      
      const stats = columnStats[highestValueColumn];
      const percentAboveAvg = ((stats.max / stats.mean - 1) * 100);
      const zScore = (stats.max - stats.mean) / stats.stdDev;
      
      insights.push(`The column "${highestValueColumn}" has the highest value at ${stats.max.toLocaleString()}, with an average of ${stats.mean.toFixed(2)}. This is ${percentAboveAvg.toFixed(0)}% above the average and represents a z-score of ${zScore.toFixed(2)}, indicating how many standard deviations it is from the mean.`);
    }
    
    // 2. Trend analysis with visualization recommendation
    if (numericColumns.length > 0) {
      // Try to detect trend in first numerical column
      const trendColumn = numericColumns[0];
      const trendResult = detectTrends(data, trendColumn);
      
      if (trendResult) {
        if (trendResult.direction === 'upward') {
          insights.push(`Trend analysis of "${trendColumn}" shows a clear upward trend with ${trendResult.consistency.toFixed(1)}% of data points increasing. The overall growth rate is approximately ${trendResult.rate.toFixed(1)}%. To visualize this trend effectively, we recommend using a line chart with a trend line overlay.`);
        } else if (trendResult.direction === 'downward') {
          insights.push(`Trend analysis of "${trendColumn}" reveals a downward trend with ${trendResult.consistency.toFixed(1)}% of data points decreasing. The overall decline rate is approximately ${trendResult.rate.toFixed(1)}%. A line chart with forecasting extensions would help visualize this declining pattern.`);
        } else {
          insights.push(`Trend analysis of "${trendColumn}" indicates a fluctuating pattern with mixed increases (${trendResult.upPercent.toFixed(1)}%) and decreases (${trendResult.downPercent.toFixed(1)}%). This suggests cyclical behavior or volatility in your data. Consider using an area chart with moving averages to smooth out the variations.`);
        }
      }
      
      // Check for seasonality/patterns
      const patternResult = detectSeasonality(data, trendColumn);
      if (patternResult) {
        insights.push(`We've detected a potential cyclical pattern in "${trendColumn}" with a period of approximately ${patternResult.patternLength} data points (confidence: ${(patternResult.confidence * 100).toFixed(0)}%). This could indicate seasonality or recurring patterns in your data that may be valuable for predictive modeling.`);
      }
    }
    
    // 3. Missing data insight
    const missingData = findMissingData(data);
    const missingDataColumns = Object.keys(missingData);
    
    if (missingDataColumns.length > 0) {
      const missingDataDetails = missingDataColumns
        .map(col => `"${col}" (${missingData[col]} rows, ${((missingData[col] / data.length) * 100).toFixed(1)}%)`)
        .join(', ');
      
      const impactLevel = Object.values(missingData).some(count => (count / data.length) > 0.2) 
        ? "significant" : "minimal";
      
      insights.push(`Data quality analysis: Missing or incomplete data detected in columns: ${missingDataDetails}. The impact on analysis is likely ${impactLevel}. ${impactLevel === "significant" ? "Consider imputation techniques or removing affected columns for more reliable insights." : "For completeness, you might want to address these gaps, though they shouldn't significantly affect results."}`);
    } else {
      insights.push(`Data quality analysis: Excellent! No missing or incomplete data detected across all ${columns.length} columns and ${data.length} rows. This complete dataset will provide the most reliable analysis results and is ideal for advanced statistical methods.`);
    }
    
    // 4. Outliers insight with enhanced interpretation
    const outlierColumns = numericColumns.filter(col => columnStats[col].hasOutliers);
    
    if (outlierColumns.length > 0) {
      const significantOutlierColumn = outlierColumns.reduce((most, column) => 
        columnStats[column].outliers.length > columnStats[most].outliers.length ? column : most, 
        outlierColumns[0]
      );
      
      const stats = columnStats[significantOutlierColumn];
      const outlierCount = stats.outliers.length;
      const outlierPercentage = ((outlierCount / data.length) * 100);
      const maxOutlier = Math.max(...stats.outliers.map(Math.abs));
      
      // Calculate potential impact of outliers on mean
      const outlierMean = stats.sum / stats.count;
      const nonOutlierSum = stats.sum - stats.outliers.reduce((acc: number, val: number) => acc + val, 0);
      const nonOutlierCount = stats.count - outlierCount;
      const nonOutlierMean = nonOutlierSum / nonOutlierCount;
      const meanImpactPercent = Math.abs((outlierMean - nonOutlierMean) / nonOutlierMean * 100);
      
      insights.push(`Outlier analysis for "${significantOutlierColumn}": Detected ${outlierCount} outliers (${outlierPercentage.toFixed(1)}% of data). The most extreme value is ${maxOutlier.toLocaleString()}, which causes a ${meanImpactPercent.toFixed(1)}% shift in the mean. ${meanImpactPercent > 10 ? "These outliers substantially impact your statistics and should be addressed before drawing conclusions." : "The overall impact on your statistics is relatively small, but addressing them would still improve precision."}`);
    } else if (numericColumns.length > 0) {
      insights.push(`Outlier analysis: No significant outliers detected in any numerical columns using the 1.5 × IQR method. Your data appears to be consistently distributed within expected ranges, which is ideal for statistical analysis and indicates strong data quality or effective pre-processing.`);
    }
    
    // 5. Correlations insight with enhanced interpretation and visualization recommendation
    const correlations = findCorrelations(data);
    
    if (correlations.length > 0) {
      const strongestCorrelation = correlations[0];
      const correlationType = strongestCorrelation.coefficient > 0 ? 'positive' : 'negative';
      
      // Interpret correlation strength
      let strengthDescription, r2Value;
      const absCoef = Math.abs(strongestCorrelation.coefficient);
      r2Value = (absCoef * absCoef);
      
      if (absCoef > 0.9) {
        strengthDescription = "very strong";
      } else if (absCoef > 0.7) {
        strengthDescription = "strong";
      } else if (absCoef > 0.5) {
        strengthDescription = "moderate";
      } else {
        strengthDescription = "weak";
      }
      
      // Add visualization and prediction recommendation
      const vizRecommendation = correlationType === 'positive'
        ? "A scatter plot with a linear trend line would effectively visualize this relationship."
        : "A scatter plot with a decreasing trend line would effectively visualize this inverse relationship.";
      
      insights.push(`Correlation analysis: Discovered a ${strengthDescription} ${correlationType} correlation (r = ${strongestCorrelation.coefficient.toFixed(2)}, R² = ${r2Value.toFixed(2)}) between "${strongestCorrelation.col1}" and "${strongestCorrelation.col2}". This means approximately ${(r2Value * 100).toFixed(0)}% of the variation in one variable can be explained by the other. ${vizRecommendation}`);
    } else if (numericColumns.length > 1) {
      insights.push(`Correlation analysis: No strong linear correlations found between numerical columns. Your variables appear to be independent, which could indicate diverse, unrelated factors in your dataset. Consider exploring non-linear relationships or performing principal component analysis to uncover more complex interactions.`);
    }
    
    // Return the top 5 most informative insights
    return insights.slice(0, 5);
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}; 