const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const sentryConfig = getSentryExpoConfig(__dirname);

// Merge configs
const config = {
  ...defaultConfig,
  ...sentryConfig,
  transformer: {
    ...defaultConfig.transformer,
    ...sentryConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    ...defaultConfig.resolver,
    ...sentryConfig.resolver,
    sourceExts: [
      ...(defaultConfig.resolver?.sourceExts || []),
      'jsx', 'js', 'ts', 'tsx', 'json'
    ],
  },
};

module.exports = withStorybook(config, {
  enabled: process.env.STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(__dirname, './.storybook'),
});