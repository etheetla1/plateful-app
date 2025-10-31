const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root directory (two levels up from apps/mobile)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const defaultConfig = getDefaultConfig(__dirname);

// Add support for .cjs files
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports to prevent module resolution issues
defaultConfig.resolver.unstable_enablePackageExports = false;

// Watch workspace packages so changes trigger reloads
defaultConfig.watchFolders = [
  path.resolve(workspaceRoot, 'packages/shared'),
  path.resolve(workspaceRoot, 'packages/ui'),
];

// Resolve workspace packages from their package.json locations
defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add alias to resolve workspace packages
// This tells Metro where to find these packages
defaultConfig.resolver.extraNodeModules = {
  '@plateful/shared': path.resolve(workspaceRoot, 'packages/shared'),
  '@plateful/ui': path.resolve(workspaceRoot, 'packages/ui'),
};

module.exports = defaultConfig;
