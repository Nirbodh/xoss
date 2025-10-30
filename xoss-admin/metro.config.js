const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add cjs extension support
config.resolver.sourceExts.push('cjs');

module.exports = config;
