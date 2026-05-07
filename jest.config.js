module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-track-player|react-native-mmkv|react-native-fs|react-native-svg|react-native-vector-icons|@react-native-firebase|react-native-video|react-native-worklets)/)',
  ],
};
