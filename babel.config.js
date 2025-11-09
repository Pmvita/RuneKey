module.exports = function(api) {
  api.cache(true);
  
  const isWeb = process.env.EXPO_PLATFORM === 'web' || process.env.BABEL_ENV === 'web';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin',
      // Transform import.meta for web compatibility (always include)
      [
        'babel-plugin-transform-import-meta',
        {
          module: 'ES6',
        },
      ],
    ],
    // For web builds, ensure node_modules packages are transformed
    ...(isWeb ? {
      overrides: [
        {
          // Include packages that might use import.meta
          test: /node_modules\/(ox|@noble\/hashes|@base-org)/,
          plugins: [
            [
              'babel-plugin-transform-import-meta',
              {
                module: 'ES6',
              },
            ],
          ],
        },
      ],
    } : {}),
  };
};