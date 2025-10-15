const path = require('path')

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ⬇️ Aliases para que imports como @lib/... funcionen en Metro
      ['module-resolver', {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@': './',
          '@components': './components',
          '@hooks': './hooks',
          '@lib': './lib',
          '@store': './store',
          '@styles': './styles',
          '@types': './types',
          '@utils': './utils',
          '@services': './services',
        },
      }],

      // ⬇️ Tamagui (usa path.join para evitar “path must be string”)
      ['@tamagui/babel-plugin', {
        components: ['tamagui'],
        config: path.join(__dirname, 'tamagui.config.ts'),
        logTimings: true,
      }],

      // ⬇️ SIEMPRE al final
      'react-native-reanimated/plugin',
    ],
  }
}
