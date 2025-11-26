const createConfig = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createConfig(env, argv);
  
  // Ensure proper MIME types for JavaScript bundles
  config.module.rules.push({
    test: /\.bundle$/,
    type: 'javascript/auto'
  });
  
  // Fix for JSON files being served with wrong MIME type
  config.output.filename = config.output.filename.replace('[name].bundle', '[name].js');
  
  return config;
};