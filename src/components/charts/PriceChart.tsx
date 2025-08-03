import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { styled } from 'nativewind';
import { ChartData } from '../../services/api/priceService';

const StyledView = styled(View);
const StyledText = styled(Text);

interface PriceChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  error?: string | null;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  isLoading = false,
  error = null,
  height = 200,
  showGrid = true,
  showLabels = true,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40; // Account for padding
  const chartHeight = height;

  if (isLoading) {
    return (
      <StyledView className="items-center justify-center" style={{ height }}>
        <StyledText className="text-ice-600 dark:text-ice-400">
          Loading chart...
        </StyledText>
      </StyledView>
    );
  }

  if (error) {
    return (
      <StyledView className="items-center justify-center" style={{ height }}>
        <StyledText className="text-red-600 dark:text-red-400 text-center">
          {error}
        </StyledText>
      </StyledView>
    );
  }

  if (!data || !data.prices || data.prices.length === 0) {
    return (
      <StyledView className="items-center justify-center" style={{ height }}>
        <StyledText className="text-ice-600 dark:text-ice-400">
          No chart data available
        </StyledText>
      </StyledView>
    );
  }

  // Process chart data
  const prices = data.prices.map(([timestamp, price]) => ({ timestamp, price }));
  const minPrice = Math.min(...prices.map(p => p.price));
  const maxPrice = Math.max(...prices.map(p => p.price));
  const priceRange = maxPrice - minPrice;

  // Calculate points for the line chart
  const points = prices.map((point, index) => {
    const x = (index / (prices.length - 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return { x, y, price: point.price, timestamp: point.timestamp };
  });

  // Generate grid lines
  const gridLines = showGrid ? Array.from({ length: 5 }, (_, i) => {
    const y = (i / 4) * chartHeight;
    const price = maxPrice - (i / 4) * priceRange;
    return { y, price };
  }) : [];

  // Generate time labels
  const timeLabels = showLabels ? [
    { x: 0, label: 'Start' },
    { x: chartWidth / 2, label: 'Mid' },
    { x: chartWidth, label: 'Now' },
  ] : [];

  return (
    <StyledView className="relative" style={{ height }}>
      {/* Chart Container */}
      <StyledView 
        className="relative overflow-hidden rounded-lg"
        style={{ width: chartWidth, height: chartHeight }}
      >
        {/* Background */}
        <StyledView 
          className="absolute inset-0 bg-ice-200/20 dark:bg-ice-800/20"
          style={{ width: chartWidth, height: chartHeight }}
        />

        {/* Grid Lines */}
        {showGrid && gridLines.map((line, index) => (
          <StyledView
            key={`grid-${index}`}
            className="absolute border-b border-ice-300/30 dark:border-ice-700/30"
            style={{
              top: line.y,
              left: 0,
              right: 0,
              height: 1,
            }}
          />
        ))}

        {/* Price Labels */}
        {showGrid && gridLines.map((line, index) => (
          <StyledText
            key={`label-${index}`}
            className="absolute text-xs text-ice-600 dark:text-ice-400"
            style={{
              top: line.y - 10,
              right: 5,
            }}
          >
            ${line.price.toFixed(2)}
          </StyledText>
        ))}

        {/* Chart Line */}
        <StyledView className="absolute inset-0">
          {points.map((point, index) => {
            if (index === 0) return null;
            
            const prevPoint = points[index - 1];
            
            return (
              <StyledView
                key={`line-${index}`}
                className="absolute bg-frost-500"
                style={{
                  left: prevPoint.x,
                  top: prevPoint.y,
                  width: point.x - prevPoint.x,
                  height: 2,
                  transform: [
                    {
                      rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x)}rad`,
                    },
                  ],
                }}
              />
            );
          })}
        </StyledView>

        {/* Data Points */}
        {points.map((point, index) => (
          <StyledView
            key={`point-${index}`}
            className="absolute w-2 h-2 bg-frost-500 rounded-full"
            style={{
              left: point.x - 4,
              top: point.y - 4,
            }}
          />
        ))}

        {/* Time Labels */}
        {showLabels && timeLabels.map((label, index) => (
          <StyledText
            key={`time-${index}`}
            className="absolute text-xs text-ice-600 dark:text-ice-400"
            style={{
              top: chartHeight + 5,
              left: label.x - 10,
            }}
          >
            {label.label}
          </StyledText>
        ))}
      </StyledView>

      {/* Price Info */}
      <StyledView className="mt-4 flex-row justify-between">
        <StyledView>
          <StyledText className="text-sm text-ice-600 dark:text-ice-400">
            Current Price
          </StyledText>
          <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
            ${prices[prices.length - 1]?.price.toFixed(2) || '0.00'}
          </StyledText>
        </StyledView>
        
        <StyledView>
          <StyledText className="text-sm text-ice-600 dark:text-ice-400">
            24h Change
          </StyledText>
          <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
            {prices.length > 1 ? 
              `${((prices[prices.length - 1].price - prices[0].price) / prices[0].price * 100).toFixed(2)}%` : 
              '0.00%'
            }
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}; 