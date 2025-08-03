const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for nativewind
config.resolver.sourceExts.push('cjs');

// Configure network settings
config.server = {
  ...config.server,
  port: 8081,
  host: '0.0.0.0', // Allow connections from any IP
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

// Add resolver configuration
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver.alias,
  },
};

module.exports = config; 