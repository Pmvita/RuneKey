/**
 * Validation utilities for the app
 */

import { SupportedNetwork } from '../types';

export const validateAddress = (address: string, network: SupportedNetwork): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  switch (network) {
    case 'solana':
      return validateSolanaAddress(address);
    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'avalanche':
    case 'arbitrum':
    case 'optimism':
      return validateEvmAddress(address);
    default:
      return false;
  }
};

export const validateSolanaAddress = (address: string): boolean => {
  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

export const validateEvmAddress = (address: string): boolean => {
  // EVM addresses are hex strings starting with 0x and 40 characters long
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmRegex.test(address);
};

export const validatePrivateKey = (privateKey: string, network: SupportedNetwork): boolean => {
  if (!privateKey || typeof privateKey !== 'string') {
    return false;
  }

  switch (network) {
    case 'solana':
      return validateSolanaPrivateKey(privateKey);
    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'avalanche':
    case 'arbitrum':
    case 'optimism':
      return validateEvmPrivateKey(privateKey);
    default:
      return false;
  }
};

export const validateSolanaPrivateKey = (privateKey: string): boolean => {
  // Solana private keys can be:
  // 1. Array format: [123, 45, 67, ...] (88 characters when stringified)
  // 2. Base58 string (88 characters)
  // 3. Hex string (128 characters, optionally with 0x prefix)
  
  if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
    try {
      const array = JSON.parse(privateKey);
      return Array.isArray(array) && array.length === 64 && array.every(n => typeof n === 'number' && n >= 0 && n <= 255);
    } catch {
      return false;
    }
  }

  if (privateKey.length === 88) {
    // Base58 format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/;
    return base58Regex.test(privateKey);
  }

  if (privateKey.length === 128 || (privateKey.startsWith('0x') && privateKey.length === 130)) {
    // Hex format
    const hexRegex = /^(0x)?[a-fA-F0-9]{128}$/;
    return hexRegex.test(privateKey);
  }

  return false;
};

export const validateEvmPrivateKey = (privateKey: string): boolean => {
  // EVM private keys are 64 character hex strings, optionally prefixed with 0x
  const hexRegex = /^(0x)?[a-fA-F0-9]{64}$/;
  return hexRegex.test(privateKey);
};

export const validateMnemonic = (mnemonic: string): boolean => {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const words = mnemonic.trim().split(/\s+/);
  
  // Mnemonic should be 12, 15, 18, 21, or 24 words
  const validLengths = [12, 15, 18, 21, 24];
  if (!validLengths.includes(words.length)) {
    return false;
  }

  // Basic validation - each word should be lowercase letters only
  const wordRegex = /^[a-z]+$/;
  return words.every(word => wordRegex.test(word));
};

export const validateAmount = (amount: string, decimals: number = 18): { isValid: boolean; error?: string } => {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid amount format' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (!isFinite(numAmount)) {
    return { isValid: false, error: 'Amount must be a finite number' };
  }

  // Check decimal places
  const decimalParts = amount.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > decimals) {
    return { isValid: false, error: `Amount cannot have more than ${decimals} decimal places` };
  }

  return { isValid: true };
};

export const validateSlippage = (slippage: number): { isValid: boolean; error?: string } => {
  if (isNaN(slippage)) {
    return { isValid: false, error: 'Invalid slippage value' };
  }

  if (slippage < 0.1) {
    return { isValid: false, error: 'Slippage must be at least 0.1%' };
  }

  if (slippage > 50) {
    return { isValid: false, error: 'Slippage cannot exceed 50%' };
  }

  return { isValid: true };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially harmful characters
  return input.replace(/[<>\"'%;()&+]/g, '');
};

export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};