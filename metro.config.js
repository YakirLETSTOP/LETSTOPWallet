const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    extraNodeModules: {
      assert: require.resolve("assert"), // assert can be polyfilled here if needed
      http: require.resolve("@tradle/react-native-http"), // stream-http can be polyfilled here if needed
      https: require.resolve("https-browserify"), // https-browserify can be polyfilled here if needed
      //os: require.resolve("empty-module"), // os-browserify can be polyfilled here if needed
      url: require.resolve("url"), // url can be polyfilled here if needed
      zlib: require.resolve("browserify-zlib"), // browserify-zlib can be polyfilled here if needed
      //path: require.resolve("empty-module"),
      crypto: require.resolve("react-native-quick-crypto"),
      stream: require.resolve("readable-stream"),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);