/**
 * Utility functions for formatting values in the app
 */

export const formatNumber = (
  value: number | string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    currency?: string;
  } = {}
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 6,
    notation = 'standard',
    currency,
  } = options;

  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      notation: notation as any,
    }).format(numValue);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    notation: notation as any,
  }).format(numValue);
};

export const formatTokenAmount = (
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount === 0) return '0';

  // Handle very small amounts
  if (numAmount < Math.pow(10, -displayDecimals)) {
    return `<${Math.pow(10, -displayDecimals)}`;
  }

  // Handle large amounts with compact notation
  if (numAmount >= 1000000) {
    return formatNumber(numAmount, {
      notation: 'compact',
      maximumFractionDigits: 2,
    });
  }

  return formatNumber(numAmount, {
    maximumFractionDigits: displayDecimals,
    minimumFractionDigits: 0,
  });
};

export const formatCurrency = (
  amount: number | string,
  currency: string = 'USD'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '$0.00';

  return formatNumber(numAmount, {
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatLargeCurrency = (
  amount: number | string,
  currency: string = 'USD'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '$0.00';

  // Format billions (1B+)
  if (numAmount >= 1000000000) {
    const billions = numAmount / 1000000000;
    return `$${billions.toFixed(1)}B`;
  }

  // Format millions (1M+)
  if (numAmount >= 1000000) {
    const millions = numAmount / 1000000;
    return `$${millions.toFixed(1)}M`;
  }

  // For amounts under 1M, use regular currency formatting
  return formatCurrency(numAmount, currency);
};

export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  if (isNaN(value)) return '0%';

  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const formatAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address || address.length < startChars + endChars) {
    return address || '';
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diff / year);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
};

export const formatTransactionHash = (hash: string): string => {
  return formatAddress(hash, 8, 8);
};

export const formatGasPrice = (gasPrice: string | number, unit: string = 'gwei'): string => {
  const numGasPrice = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;
  
  if (isNaN(numGasPrice)) return '0 ' + unit;

  return `${formatNumber(numGasPrice, { maximumFractionDigits: 2 })} ${unit}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const sanitizeNumericInput = (input: string): string => {
  // Remove any non-numeric characters except decimal point
  let cleaned = input.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
};

export const validateNumericInput = (input: string): boolean => {
  if (!input) return true; // Allow empty string
  
  const numValue = parseFloat(input);
  return !isNaN(numValue) && numValue >= 0 && isFinite(numValue);
};