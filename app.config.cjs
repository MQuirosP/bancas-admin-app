// app.config.cjs
module.exports = ({ config }) => ({
  ...config,
  name: 'bancas-admin-app',
  slug: 'bancas-admin-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mquirosp.bancasadminapp',
  },
  android: {
    package: 'com.mquirosp.bancasadminapp',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    ['expo-build-properties', { android: { kotlinVersion: '1.8.0' } }],
    'expo-secure-store',
  ],
  experiments: { typedRoutes: true },
  // Usa variable pública (mejor para cliente)
  extra: {
    EXPO_PUBLIC_API_URL:
      process.env.EXPO_PUBLIC_API_URL ?? 'https://backend-bancas.onrender.com/api/v1',
      //process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  },
})
