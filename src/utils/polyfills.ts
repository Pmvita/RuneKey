/**
 * Polyfills for React Native / Hermes compatibility
 * Required for crypto libraries that expect web APIs
 */

import 'react-native-get-random-values';

// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Crypto polyfill for web3 libraries
if (typeof global.crypto === 'undefined') {
  const crypto = require('expo-crypto');
  global.crypto = crypto;
}

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Process polyfill
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    version: '',
    nextTick: (fn: Function) => setTimeout(fn, 0),
  } as any;
}

// URL polyfill for React Native
if (typeof global.URL === 'undefined') {
  const { URL, URLSearchParams } = require('react-native-url-polyfill/auto');
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

// import.meta polyfill for web bundling
// Only set on web platform where window is available
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore - checking if importMeta exists
    if (typeof (global as any).importMeta === 'undefined') {
      const getUrl = () => {
        try {
          return (window as any).location?.href || '';
        } catch {
          return '';
        }
      };
      
      // @ts-ignore - polyfill for import.meta
      (global as any).importMeta = {
        url: getUrl(),
        env: {},
      };
    }
  } catch (error) {
    // Silently fail if we can't set global.importMeta
  }
}

// Polyfill import.meta for CommonJS environments (web only)
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore - checking if importMeta exists on globalThis
    if (typeof (globalThis as any).importMeta === 'undefined') {
      const getUrl = () => {
        try {
          return (window as any).location?.href || '';
        } catch {
          return '';
        }
      };
      
      // @ts-ignore - polyfill for import.meta on globalThis
      (globalThis as any).importMeta = {
        url: getUrl(),
        env: {},
      };
    }
  } catch (error) {
    // Silently fail if we can't set globalThis.importMeta
  }
}

console.log('✅ Polyfills loaded successfully');