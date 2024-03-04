/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigators, so head over there
 * if you're interested in adding screens and navigators.
 */
import firebaseApp from "@react-native-firebase/app"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import functions from "@react-native-firebase/functions"
import fbStorage from "@react-native-firebase/storage"
import Constants from "expo-constants"
import * as Device from "expo-device"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import * as Notifications from "expo-notifications"
import React from "react"
import { ViewStyle } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { RootSiblingParent } from "react-native-root-siblings"
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context"
import { TamaguiProvider } from "tamagui"
import Config from "./config"
import { useNotification } from "./hooks"
import "./i18n"
import { AppNavigator } from "./navigators"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { LoadingScreen } from "./screens"
import { ErrorBoundary } from "./screens/ErrorScreen/ErrorBoundary"
import { useInitialRootStore } from "./stores"
import tamaguiConfig from "./tamagui.config"
import { customFontsToLoad } from "./theme"
import "./utils/ignoreWarnings"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Linking configuration
const linkPrefix = Linking.createURL("")
// See: https://reactnavigation.org/docs/configuring-links#mapping-path-to-route-names
const linkingConfig = {
  screens: {
    MainNavigator: {
      screens: {
        ActiveWorkout: "activeWorkout",
      },
    },
    AuthNavigator: {
      screens: {
        EmailVerified: "auth/email-verified",
      },
    },
  },
}
const linking = {
  prefixes: [linkPrefix, "https://gymrapp.com", "https://gymrapp-test.web.app"],
  config: linkingConfig,
  // See: https://reactnavigation.org/docs/navigation-container#linkinggetinitialurl
  async getInitialURL() {
    // First, you may want to do the default deep link handling
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL()

    if (url != null) {
      return url
    }

    // Handle URL from notifications
    const response = await Notifications.getLastNotificationResponseAsync()

    return response?.notification.request.content?.data?.url
  },
  // See: https://reactnavigation.org/docs/navigation-container/#linkingsubscribe
  subscribe(listener) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url)

    // Listen to incoming links from deep linking
    const eventListenerSubscription = Linking.addEventListener("url", onReceiveURL)

    // Listen to expo push notifications
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data.url

      // Let React Navigation handle the URL
      listener(url)
    })

    return () => {
      // Clean up the event listeners
      eventListenerSubscription.remove()
      subscription.remove()
    }
  },
}

// See: https://docs.expo.dev/versions/latest/sdk/notifications/#handle-incoming-notifications-when-the-app-is
// This handles notifications received when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.debug("Received a notification while app is in the foreground!")
    return {
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }
  },
  handleSuccess: (notificationId) => {
    console.debug("Notification handled successfully:", notificationId)
  },
})

// // See: https://docs.expo.dev/versions/latest/sdk/notifications/#handle-incoming-notifications-when-the-app-is-1
// // This handles notifications received when app is in the background
// TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK_NAME, ({ data, error, executionInfo }) => {
//   console.debug("Received a notification in the background!", { data, error, executionInfo })
//   // Do something with the notification data
// })

// Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK_NAME)

// Firebase emulator setup
if (__DEV__) {
  require("./utils/devtools/ReactotronConfig.ts")

  if (Number(process.env.EXPO_PUBLIC_USE_EMULATOR)) {
    console.debug("Connecting to Firebase emulators (In DEV mode and EXPO_PUBLIC_USE_EMULATOR = 1)")

    let localIp
    if (Device.isDevice) {
      console.debug(
        "Running on physical device, make sure local environment variable EXPO_PUBLIC_EMULATOR_IP is updated when switching networks",
      )
      localIp = process.env.EXPO_PUBLIC_EMULATOR_IP // For physical device, use local IP on network
    } else {
      console.debug("Running on device emulator")
      localIp = "localhost" // For emulators
    }

    auth().useEmulator(`http://${localIp}:${process.env.EXPO_PUBLIC_EMULATOR_AUTH_PORT}`)
    firestore().useEmulator(localIp, Number(process.env.EXPO_PUBLIC_EMULATOR_FIRESTORE_PORT))
    functions().useEmulator(localIp, Number(process.env.EXPO_PUBLIC_EMULATOR_FUNCTIONS_PORT))
    fbStorage().useEmulator(localIp, Number(process.env.EXPO_PUBLIC_EMULATOR_STORAGE_PORT))

    // See: https://github.com/firebase/firebase-js-sdk/issues/3838
    firestore().settings({
      persistence: false,
    })
  } else {
    const firebaseProjectId = firebaseApp.app().options.projectId
    const envMode = Constants.expoConfig?.extra?.gymrappEnvironment

    if (envMode !== "development" || firebaseProjectId !== "gymrapp-test") {
      console.error("firebaseProjectId:", firebaseProjectId)
      console.error("envMode:", envMode)
      throw new Error(
        "Environment variable GYMRAPP_ENVIRONMENT must be 'development' in __DEV__ mode. This ensures you connect to the test Firebase project if you are not using the emulator",
      )
    } else {
      console.debug(
        "Connecting to Firebase test project (In DEV mode, EXPO_PUBLIC_USE_EMULATOR = 0, GYMRAPP_ENVIRONMENT = development)",
      )
    }
  }
}

interface AppProps {
  hideSplashScreen: () => Promise<void>
}

/**
 * This is the root component of our app.
 */
function App(props: AppProps) {
  const { hideSplashScreen } = props
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded] = useFonts(customFontsToLoad)

  useNotification()

  // IMPORTANT: Make sure to test the app with and without useInitialRootStore to ensure
  // that your app works both with existing store snapshots and without (fresh install).
  // TODO: Disabling store rehydration for now, as it's causing issues with the app not loading
  // and troubles with app updates still hydrating with old possibly problematic store snapshots
  // const rehydrated = true
  // setTimeout(hideSplashScreen, 500)
  const { rootStore, rehydrated } = useInitialRootStore(() => {
    // This runs after the root store has been initialized and rehydrated.

    // If your initialization scripts run very fast, it's good to show the splash screen for just a bit longer to prevent flicker.
    // Slightly delaying splash screen hiding for better UX; can be customized or removed as needed,
    // Note: (vanilla Android) The splash-screen will not appear if you launch your app via the terminal or Android Studio. Kill the app and launch it normally by tapping on the launcher icon. https://stackoverflow.com/a/69831106
    // Note: (vanilla iOS) You might notice the splash-screen logo change size. This happens in debug/development mode. Try building the app for release.
    setTimeout(hideSplashScreen, 500)
  })

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  // In iOS: application:didFinishLaunchingWithOptions:
  // In Android: https://stackoverflow.com/a/45838109/204044
  // You can replace with your own loading component if you wish.
  if (!rehydrated || !isNavigationStateRestored || !areFontsLoaded) return <LoadingScreen />

  // otherwise, we're ready to render the app
  return (
    <GestureHandlerRootView style={$gestureHandlerRootView}>
      <TamaguiProvider config={tamaguiConfig}>
        <RootSiblingParent>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <ErrorBoundary catchErrors={Config.catchErrors}>
              <AppNavigator
                linking={linking}
                fallback={<LoadingScreen />}
                initialState={initialNavigationState}
                onStateChange={onNavigationStateChange}
              />
            </ErrorBoundary>
          </SafeAreaProvider>
        </RootSiblingParent>
      </TamaguiProvider>
    </GestureHandlerRootView>
  )
}

export default App

const $gestureHandlerRootView: ViewStyle = {
  flex: 1,
}
