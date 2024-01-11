import { ConfigContext, ExpoConfig } from "expo/config"

const getEnv = (key: string) => {
  const envMode = process.env?.GYMRAPP_ENVIRONMENT?.toLowerCase()
  switch (envMode) {
    case "production":
      return process.env[key]
    // case "staging":
    //   return process.env[`STAGING_${key}`]
    // case "test":
    //   return process.env[`TEST_${key}`]
    case "development":
      return process.env[`DEV_${key}`]
    default:
      return process.env[key]
    // throw new Error(
    //   `GYMRAPP_ENVIRONMENT '${envMode}' not valid. Must be one of: production, development`,
    // )
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Gymrapp",
  slug: "gymrapp",
  scheme: "gymrapp",
  version: "0.0.1",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/images/app-icon-all.png",
  splash: {
    image: "./assets/images/splash-logo-all.png",
    resizeMode: "contain",
    backgroundColor: "#212121",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  jsEngine: "hermes",
  assetBundlePatterns: ["**/*"],
  android: {
    // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
    ...config.android,
    googleServicesFile: getEnv("GOOGLE_SERVICES_JSON"),
    icon: "./assets/images/app-icon-android-legacy.png",
    package: "com.gymrapp",
    adaptiveIcon: {
      foregroundImage: "./assets/images/app-icon-android-adaptive-foreground.png",
      backgroundImage: "./assets/images/app-icon-android-adaptive-background.png",
    },
    splash: {
      image: "./assets/images/splash-logo-all.png",
      resizeMode: "contain",
      backgroundColor: "#212121",
    },
  },
  ios: {
    // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
    ...config.ios,
    usesAppleSignIn: true,
    googleServicesFile: getEnv("GOOGLE_SERVICES_PLIST"),
    icon: "./assets/images/app-icon-ios.png",
    supportsTablet: true,
    bundleIdentifier: "com.gymrapp",
    splash: {
      image: "./assets/images/splash-logo-all.png",
      resizeMode: "contain",
      backgroundColor: "#212121",
    },
  },
  plugins: [
    "@react-native-firebase/app",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    "expo-localization",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
    "@react-native-google-signin/google-signin",
    "expo-apple-authentication",
  ],
  extra: {
    eas: {
      projectId: "f5644dcf-c1f4-47a8-b64c-712e94371abb",
    },
    gymrappEnvironment: process.env.GYMRAPP_ENVIRONMENT,
    // googleClientId: process.env.GOOGLE_CLIENT_ID, // TODO: Not sure if this is needed, try building without
  },
  owner: "ktalexcheng",
})
