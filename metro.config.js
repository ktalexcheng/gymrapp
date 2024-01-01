const { getDefaultConfig } = require("@expo/metro-config")

const config = getDefaultConfig(__dirname)

// For iOS build, this is required: https://github.com/expo/expo/issues/23180
config.resolver.sourceExts.push("mjs", "cjs")

module.exports = config
