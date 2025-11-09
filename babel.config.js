module.exports = function(api) {
  api.cache(true);
  
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
  };
};