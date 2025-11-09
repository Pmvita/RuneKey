const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
  unstable_allowRequireContext: true,
  // Enable import.meta transformation for web
  unstable_importMeta: true,
  // Transform node_modules packages that use import.meta
  getTransformOptions: async (entryPoints, bundler) => {
    const isWeb = bundler === 'web';
    return {
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
      // Transform import.meta for web bundling
      platform: isWeb ? 'web' : undefined,
    };
  },
  // Custom transformer to ensure import.meta is transformed in all files including node_modules
  babelTransformerPath: require.resolve('./metro-transformer.js'),
};

// Function to check if we're bundling for web
const isWebBundle = (() => {
  try {
    // Check if we're in a web context
    return typeof window !== 'undefined' || 
           (typeof process !== 'undefined' && process.env.EXPO_PLATFORM === 'web') ||
           (typeof navigator !== 'undefined');
  } catch {
    return false;
  }
})();

// Custom resolver to stub viem and wagmi on web
const path = require('path');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  // Block viem and its submodules on web - return stub
  if (platform === 'web') {
    if (realModuleName === 'viem' || realModuleName.startsWith('viem/')) {
      return {
        filePath: path.resolve(__dirname, 'web-stubs/viem-stub.js'),
        type: 'sourceFile',
      };
    }
    // Also stub wagmi on web since it depends on viem
    if (realModuleName === 'wagmi' || realModuleName.startsWith('wagmi/')) {
      return {
        filePath: path.resolve(__dirname, 'web-stubs/viem-stub.js'), // Use same stub
        type: 'sourceFile',
      };
    }
    // Handle @noble/hashes/crypto.js which uses import.meta
    if (realModuleName === '@noble/hashes/crypto.js' || realModuleName.endsWith('@noble/hashes/crypto.js')) {
      // Try to resolve to the main entry point instead
      try {
        const mainPath = require.resolve('@noble/hashes', { paths: [context.originModulePath || __dirname] });
        return {
          filePath: mainPath,
          type: 'sourceFile',
        };
      } catch {
        // Fall through to original resolver
      }
    }
  }
  
  // Use original resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, realModuleName, platform, moduleName);
  }
  return context.resolveRequest(context, realModuleName, platform);
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
    ...(config.resolver.blockList || []),
    /node_modules\/ws\/lib\/stream\.js$/,
    /node_modules\/ws\/wrapper\.mjs$/,
    // Block @noble/hashes crypto.js file that uses import.meta on web
    ...(process.env.EXPO_PLATFORM === 'web' ? [/node_modules\/@noble\/hashes\/crypto\.js$/] : []),
    // Note: viem is handled by custom resolver above (stubbed on web, allowed on native)
  ],
  // Support for dynamic imports in packages like viem
  unstable_enablePackageExports: true,
  // Transform node_modules packages that use import.meta (for web)
  unstable_conditionNames: ['browser', 'require', 'react-native'],
};

module.exports = config; 