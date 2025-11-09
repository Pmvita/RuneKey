const upstreamTransformer = require('metro-react-native-babel-transformer');

module.exports.transform = async ({ src, filename, options }) => {
  // Check if this is a web build and the file contains import.meta
  const isWeb = options.platform === 'web' || process.env.EXPO_PLATFORM === 'web';
  const hasImportMeta = src.includes('import.meta');
  
  // Apply the upstream transformer (which includes our Babel config with import.meta transform)
  const result = await upstreamTransformer.transform({ src, filename, options });
  
  // Double-check: if import.meta still exists in the transformed code, transform it again
  if (isWeb && hasImportMeta && result.code && result.code.includes('import.meta')) {
    try {
      const { transform } = require('@babel/core');
      const transformed = await transform(result.code, {
        filename,
        plugins: [
          [
            require.resolve('babel-plugin-transform-import-meta'),
            {
              module: 'ES6',
            },
          ],
        ],
        compact: false,
      });
      
      if (transformed && transformed.code && !transformed.code.includes('import.meta')) {
        return {
          ...result,
          code: transformed.code,
        };
      }
    } catch (error) {
      // If transformation fails, return original result
      console.warn(`Failed to transform import.meta in ${filename}:`, error.message);
    }
  }
  
  return result;
};

