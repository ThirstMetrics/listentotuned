/**
 * Jest setup file — mocks native modules that aren't available in the test environment.
 */

// react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: require('react-native').ScrollView,
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    NativeViewGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    TouchableHighlight: View,
    TouchableNativeFeedback: View,
    TouchableOpacity: View,
    TouchableWithoutFeedback: View,
    Directions: {},
    gestureHandlerRootHOC: (component) => component,
  };
});

// react-native-reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  enableFreeze: jest.fn(),
  Screen: require('react-native').View,
  ScreenContainer: require('react-native').View,
  NativeScreen: require('react-native').View,
  NativeScreenContainer: require('react-native').View,
  ScreenStack: require('react-native').View,
  ScreenStackHeaderConfig: require('react-native').View,
}));

// react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: require('react-native').View,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// react-native-track-player
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setRate: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue(0),
    getProgress: jest.fn().mockResolvedValue({ position: 0, duration: 0, buffered: 0 }),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    registerPlaybackService: jest.fn(),
    addEventListener: jest.fn(),
  },
  useProgress: () => ({ position: 0, duration: 0, buffered: 0 }),
  usePlaybackState: () => ({ state: undefined }),
  useActiveTrack: () => null,
  State: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped', None: 'none' },
  Capability: { Play: 0, Pause: 1, SkipToNext: 2, SkipToPrevious: 3, SeekTo: 4, JumpForward: 5, JumpBackward: 6 },
  Event: { PlaybackState: 'playback-state', PlaybackError: 'playback-error', RemotePlay: 'remote-play', RemotePause: 'remote-pause' },
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
  AppKilledPlaybackBehavior: { StopPlaybackAndRemoveNotification: 0 },
}));

// react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => {
    const store = new Map();
    return {
      getString: jest.fn((key) => store.get(key)),
      getBoolean: jest.fn((key) => {
        const v = store.get(key);
        return typeof v === 'boolean' ? v : undefined;
      }),
      getNumber: jest.fn((key) => {
        const v = store.get(key);
        return typeof v === 'number' ? v : undefined;
      }),
      set: jest.fn((key, value) => store.set(key, value)),
      delete: jest.fn((key) => store.delete(key)),
      contains: jest.fn((key) => store.has(key)),
      getAllKeys: jest.fn(() => Array.from(store.keys())),
      clearAll: jest.fn(() => store.clear()),
    };
  }),
}));

// react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  downloadFile: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  readDir: jest.fn().mockResolvedValue([]),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// @react-native-firebase/app
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    onNotification: jest.fn(),
    onNotificationDisplayed: jest.fn(),
  }),
}));

// @react-native-firebase/auth
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    currentUser: null,
  }),
}));
