import React from 'react';
import { CustomLoadingAnimation } from './CustomLoadingAnimation';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: string;
  backgroundColor?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  spinnerSize = 'large',
  spinnerColor = '#3B82F6',
  backgroundColor = '#0F172A',
}) => {
  if (!visible) return null;

  return (
    <CustomLoadingAnimation
      message={message}
      size={spinnerSize}
      variant="overlay"
      backgroundColor={backgroundColor}
      spinnerColor={spinnerColor}
    />
  );
};
