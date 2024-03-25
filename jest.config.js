// const { defaults: tsjPreset } = require("ts-jest/presets")

/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  // ...tsjPreset,
  preset: "jest-expo",
  transformIgnorePatterns: [
    // "<rootDir>/node_modules/(react-clone-referenced-element|@react-native-community|react-navigation|@react-navigation/.*|@unimodules/.*|react-native-code-push)",
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
    "jest-runner",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.maestro/",
    "@react-native",
    "<rootDir>/test/scripts",
  ],
  // Note: firebase-admin is meant for node.js
  //       set testEnvironment: "node" in order to use firebase-admin
  testEnvironment: "node",
  setupFiles: [
    "<rootDir>/test/setup.ts",
    "<rootDir>/node_modules/@react-native-google-signin/google-signin/jest/build/setup.js",
  ],
  testTimeout: 600000,
  moduleNameMapper: {
    "^app/(.*)$": "<rootDir>/app/$1",
  },
}
