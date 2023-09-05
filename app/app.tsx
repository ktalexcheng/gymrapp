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
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import functions from "@react-native-firebase/functions"
import fbStorage from "@react-native-firebase/storage"
import * as Device from "expo-device"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { NativeBaseProvider } from "native-base"
import React from "react"
import { ViewStyle } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import Config from "./config"
import "./i18n"
import { AppNavigator } from "./navigators"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { ErrorBoundary } from "./screens/ErrorScreen/ErrorBoundary"
import { setupReactotron } from "./services/reactotron"
import { useInitialRootStore } from "./stores"
import { customFontsToLoad } from "./theme"
import "./utils/ignoreWarnings"
import * as storage from "./utils/storage"

// Set up Reactotron, which is a free desktop app for inspecting and debugging
// React Native apps. Learn more here: https://github.com/infinitered/reactotron
setupReactotron({
  // clear the Reactotron window when the app loads/reloads
  clearOnLoad: true,
  // generally going to be localhost
  host: "localhost",
  // Reactotron can monitor AsyncStorage for you
  useAsyncStorage: true,
  // log the initial restored state from AsyncStorage
  logInitialState: true,
  // log out any snapshots as they happen (this is useful for debugging but slow)
  logSnapshots: false,
})

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    // Login: {
    //   path: "",
    // },
    // Welcome: "welcome",
    // Demo: {
    //   screens: {
    //     DemoShowroom: {
    //       path: "showroom/:queryIndex?/:itemIndex?",
    //     },
    //     DemoDebug: "debug",
    //     DemoPodcastList: "podcast",
    //     DemoCommunity: "community",
    //   },
    // },
  },
}

// Firebase emulator setup
if (__DEV__) {
  let localIp
  if (Device.isDevice) {
    console.debug("Running on physical device")
    localIp = "192.168.50.176" // For physical device, use local IP on network
  } else {
    console.debug("Running on emulator")
    localIp = "localhost" // For emulators
  }
  auth().useEmulator(`http://${localIp}:9099`)
  firestore().useEmulator(localIp, 8080)
  functions().useEmulator(localIp, 5001)
  fbStorage().useEmulator(localIp, 9199)
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

  // TODO: Persisted state may not be desirable during development, disable/enable it here
  // const rehydrated = true
  // setTimeout(hideSplashScreen, 500)
  const { rehydrated } = useInitialRootStore(() => {
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
  if (!rehydrated || !isNavigationStateRestored || !areFontsLoaded) return null

  const linking = {
    prefixes: [prefix],
    config,
  }

  const $gestureHandlerRootView: ViewStyle = {
    flex: 1,
  }

  // otherwise, we're ready to render the app
  return (
    <GestureHandlerRootView style={$gestureHandlerRootView}>
      <NativeBaseProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ErrorBoundary catchErrors={Config.catchErrors}>
            <AppNavigator
              linking={linking}
              initialState={initialNavigationState}
              onStateChange={onNavigationStateChange}
            />
          </ErrorBoundary>
        </SafeAreaProvider>
      </NativeBaseProvider>
    </GestureHandlerRootView>
  )
}

export default App
