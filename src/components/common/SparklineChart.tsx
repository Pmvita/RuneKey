import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  strokeWidth?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width,
  height,
  color,
  strokeWidth = 2,
}) => {
  if (!data || data.length < 2) {
    return (
      <View style={{ width, height, backgroundColor: 'transparent' }}>
        <Svg width={width} height={height}>
          <Line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.3}
          />
        </Svg>
      </View>
    );
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ width, height, backgroundColor: 'transparent' }}>
      <Svg width={width} height={height}>
        <Path
          d={`M ${points}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
