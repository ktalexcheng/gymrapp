import { ConfigContext, ExpoConfig } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env?.GYMRAPP_ENVIRONMENT?.toLowerCase() === "development"

  return {
    ...config,
    name: isDev ? "Gymrapp (Dev)" : "Gymrapp", // This is the name that appears on the home screen
    slug: "gymrapp", // This is the name of the project on Expo
    scheme: "gymrapp",
    version: "0.1.1",
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
      permissions: ["android.permission.USE_EXACT_ALARM"],
      googleServicesFile: isDev
        ? process.env.GOOGLE_SERVICES_JSON_TEST
        : process.env.GOOGLE_SERVICES_JSON,
      icon: "./assets/images/app-icon-android-legacy.png",
      package: isDev ? "com.gymrapp.dev" : "com.gymrapp",
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon-android-adaptive-foreground.png",
        backgroundImage: "./assets/images/app-icon-android-adaptive-background.png",
      },
      splash: {
        image: "./assets/images/splash-logo-all.png",
        resizeMode: "contain",
        backgroundColor: "#212121",
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            // http scheme is only to support opening app from Gmail, not sure why it's needed but it won't work without it
            {
              scheme: "http",
              host: "gymrapp.com",
              pathPrefix: "/auth/email-verified",
            },
            {
              scheme: "https",
              host: "gymrapp.com",
              pathPrefix: "/auth/email-verified",
            },
            // These are the development domains
            {
              scheme: "http",
              host: "gymrapp-test.web.app",
              pathPrefix: "/auth/email-verified",
            },
            {
              scheme: "https",
              host: "gymrapp-test.web.app",
              pathPrefix: "/auth/email-verified",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    ios: {
      // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
      ...config.ios,
      usesAppleSignIn: true,
      googleServicesFile: isDev
        ? process.env.GOOGLE_SERVICES_PLIST_TEST
        : process.env.GOOGLE_SERVICES_PLIST,
      icon: "./assets/images/app-icon-ios.png",
      supportsTablet: true,
      bundleIdentifier: isDev ? "com.gymrapp.dev" : "com.gymrapp",
      splash: {
        image: "./assets/images/splash-logo-all.png",
        resizeMode: "contain",
        backgroundColor: "#212121",
      },
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        CFBundleAllowMixedLocalizations: true,
      },
      associatedDomains: ["applinks:gymrapp.com", "applinks:gymrapp-test.web.app"],
    },
    plugins: [
      "@react-native-firebase/app",
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
        // {
        //   locationWhenInUsePermission:
        //     "$(PRODUCT_NAME) uses your location to verify your proximity to a gym when recording a workout.",
        // },
      ],
      [
        "expo-notifications",
        {
          sounds: ["assets/sounds/rest_time_notification.wav"],
        },
      ],
      "expo-font",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
    ],
    locales: {
      en: "./languages/en.json",
      zh: "./languages/zh.json",
    },
    extra: {
      eas: {
        projectId: "f5644dcf-c1f4-47a8-b64c-712e94371abb",
      },
      gymrappEnvironment: process.env.GYMRAPP_ENVIRONMENT,
      googleOauthClientId: isDev ? process.env.GOOGLE_CLIENT_ID_TEST : process.env.GOOGLE_CLIENT_ID, // Required for react-native-google-signin
    },
    owner: "ktalexcheng",
  }
}
