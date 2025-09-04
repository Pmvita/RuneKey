const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for nativewind
config.resolver.sourceExts.push('cjs');

// Configure network settings
config.server = {
  ...config.server,
  port: 8081,
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Add resolver configuration for Node.js polyfills
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver.alias,
    // Polyfill Node.js modules for React Native
    'stream': 'react-native-stream',
    'crypto': 'react-native-crypto',
    'buffer': '@craftzdog/react-native-buffer',
    // Exclude problematic ws package completely
    'ws': false,
  },
  // Exclude problematic Node.js modules
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Block problematic packages
  blockList: [
    /node_modules\/ws\/lib\/stream\.js$/,
    /node_modules\/ws\/wrapper\.mjs$/,
  ],
};

module.exports = config; 