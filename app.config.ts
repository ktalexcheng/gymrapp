import { ConfigContext, ExpoConfig } from "expo/config"
import * as fs from "fs"

const getEnv = (key: string) => {
  const envMode = process.env?.GYMRAPP_ENVIRONMENT?.toLowerCase()
  switch (envMode) {
    case "production":
      return process.env[key]
    case "development":
      return process.env[`DEV_${key}`]
    default:
      return process.env[`DEV_${key}`]
    // throw new Error(
    //   `GYMRAPP_ENVIRONMENT '${envMode}' not valid. Must be one of: production, development`,
    // )
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const envMode = process.env?.GYMRAPP_ENVIRONMENT?.toLowerCase()
  const isDev = envMode === "development"
  const googleServicesFilePath = getEnv("GOOGLE_SERVICES_JSON")
  const googleServicesFileContent = fs.readFileSync(googleServicesFilePath, {
    encoding: "utf-8",
  })
  const googleServicesFile = JSON.parse(googleServicesFileContent)
  const googleOauthClientId = (googleServicesFile.client[0].oauth_client as Array<any>).find(
    (c) => c.client_type === 3,
  ).client_id

  return {
    ...config,
    name: isDev ? "Gymrapp (Dev)" : "Gymrapp",
    slug: isDev ? "gymrapp-dev" : "gymrapp",
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
    },
    ios: {
      // Only using app.json for versionCode and buildNumber since we are using "appVersionSource" = "local" in EAS
      ...config.ios,
      usesAppleSignIn: true,
      googleServicesFile: getEnv("GOOGLE_SERVICES_PLIST"),
      icon: "./assets/images/app-icon-ios.png",
      supportsTablet: true,
      bundleIdentifier: isDev ? "com.gymrapp.dev" : "com.gymrapp",
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
      googleOauthClientId, // Required for react-native-google-signin
    },
    owner: "ktalexcheng",
  }
}
