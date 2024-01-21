/** @type {import('@babel/core').TransformOptions['plugins']} */
const plugins = [
  [
    // Enables baseUrl: "./" option in tsconfig.json to work @see https://github.com/entwicklerstube/babel-plugin-root-import
    "babel-plugin-root-import",
    {
      paths: [
        {
          rootPathPrefix: "app/",
          rootPathSuffix: "app",
        },
        {
          rootPathPrefix: "assets/",
          rootPathSuffix: "assets",
        },
      ],
    },
  ],
  [
    "@tamagui/babel-plugin",
    {
      components: ["tamagui"],
      config: "./app/tamagui.config.ts",
      logTimings: true,
    },
  ],
  // This is for the "firebase" package that is used in Jest tests
  ["@babel/plugin-transform-private-methods", { loose: true }],
  // NOTE: This must be last in the plugins @see https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/#step-2-add-reanimateds-babel-plugin
  "react-native-reanimated/plugin",
]

/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  presets: ["babel-preset-expo"],
  env: {
    production: {},
  },
  plugins,
}
