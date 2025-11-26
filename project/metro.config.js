// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for web MIME type issue
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'json');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'json'];

module.exports = config;