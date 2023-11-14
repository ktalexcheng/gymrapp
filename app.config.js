import "dotenv/config"

export default ({ config }) => ({
  ...config,
  name: "GymRapp",
  displayName: "GymRapp",
  expo: {
    name: "GymRapp",
    slug: "gymrapp",
    scheme: "gymrapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app-icon-all.png",
    splash: {
      image: "./assets/images/splash-logo-all.png",
      resizeMode: "contain",
      backgroundColor: "#191015",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    jsEngine: "hermes",
    assetBundlePatterns: ["**/*"],
    android: {
      // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      icon: "./assets/images/app-icon-android-legacy.png",
      package: "com.gymrapp",
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon-android-adaptive-foreground.png",
        backgroundImage: "./assets/images/app-icon-android-adaptive-background.png",
      },
      splash: {
        image: "./assets/images/splash-logo-android-universal.png",
        resizeMode: "contain",
        backgroundColor: "#191015",
      },
    },
    ios: {
      // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
      ...config.ios,
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      icon: "./assets/images/app-icon-ios.png",
      supportsTablet: true,
      bundleIdentifier: "com.gymrapp",
      splash: {
        image: "./assets/images/splash-logo-ios-mobile.png",
        tabletImage: "./assets/images/splash-logo-ios-tablet.png",
        resizeMode: "contain",
        backgroundColor: "#191015",
      },
    },
    web: {
      favicon: "./assets/images/app-icon-web-favicon.png",
      splash: {
        image: "./assets/images/splash-logo-web.png",
        resizeMode: "contain",
        backgroundColor: "#191015",
      },
    },
    plugins: [
      "@react-native-firebase/app",
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
    ],
    extra: {
      eas: {
        projectId: "f5644dcf-c1f4-47a8-b64c-712e94371abb",
      },
      googleClientId: process.env.GOOGLE_CLIENT_ID,
    },
    owner: "ktalexcheng",
  },
})
