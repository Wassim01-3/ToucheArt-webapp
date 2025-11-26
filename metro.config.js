const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add 'cjs' to the list of source extensions to support Firebase's CommonJS modules
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports to prevent module resolution issues
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;

