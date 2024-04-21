/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { Icon, RowView, Spacer, Text } from "app/components"
import { AppColorScheme, AppLocale } from "app/data/constants"
import { translate } from "app/i18n"
import { LoadingScreen } from "app/screens"
import { api } from "app/services/api"
import { spacing } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import Constants from "expo-constants"
import * as NavigationBar from "expo-navigation-bar"
import { setStatusBarStyle } from "expo-status-bar"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"

import { useInternetStatus, useLocale, useToast } from "app/hooks"
import {
  Alert,
  AlertButton,
  AppState,
  Linking,
  Platform,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from "react-native"
import Config from "../config"
import { useStores } from "../stores"
import { darkColors, lightColors } from "../theme/colors"
import { AuthNavigator } from "./AuthNavigator"
import { MainNavigator } from "./MainNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`. Generally speaking, we
 * recommend using your MobX-State-Tree store(s) to keep application state
 * rather than passing state through navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type AppStackParamList = {
  Welcome: undefined
  // 🔥 Your screens go here
  AppDisabled: undefined
  MainNavigator: undefined
  AuthNavigator: undefined
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = observer(() => {
  const { authenticationStore: authStore, userStore, feedStore, exerciseStore } = useStores()
  const [forceUpdate, setForceUpdate] = useState(false)
  const [checkUpdateError, setCheckUpdateError] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true) // To prevent initial route flicker

  // Handle user state changes
  async function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    // Update authentication and user data
    if (user) {
      console.debug("onAuthStateChanged received valid user", { user })
      authStore.setFirebaseUser(user)
      // Don't load user data if email is not verified
      if (user.emailVerified) {
        console.debug("onAuthStateChanged user is email verified")
        await userStore.loadUserWithId(user.uid)
      }
    } else {
      console.debug("onAuthStateChanged received invalid user, invalidating session")
      await authStore.invalidateSession()
      userStore.invalidateSession()
      feedStore.resetFeed()
    }

    setIsInitializing(false)
  }

  useEffect(() => {
    // Check for updates
    const checkForUpdates = async () => {
      try {
        // const appLastUpdated = await storage.getAppLastUpdated()
        // console.debug("AppNavigator.checkForUpdates appLastUpdated:", appLastUpdated)
        // if (appLastUpdated && Date.now() - appLastUpdated < Config.checkAppUpdateInterval) {
        //   console.debug("AppNavigator.checkForUpdates: app updated < 24 hours, skipping")
        //   return
        // }

        setCheckUpdateError(false)

        let updates
        if (exerciseStore.lastUpdated) {
          updates = await api.checkForUpdates(exerciseStore.lastUpdated)
          console.debug("AppNavigator.checkForUpdates response:", updates)
        }

        if (updates && updates.updateAvailable) {
          if (updates.forceUpdate) {
            setForceUpdate(true)
          }

          const alertButtons: AlertButton[] = [
            {
              text: translate("updateApp.update"),
              onPress: () => {
                Linking.openURL(updates.updateLink)
              },
            },
          ]

          if (!updates.forceUpdate) {
            alertButtons.push({
              text: translate("common.cancel"),
              onPress: () => {},
              style: "cancel",
            })
          }

          Alert.alert(
            updates.forceUpdate
              ? translate("updateApp.forceUpdateTitle")
              : translate("updateApp.updateAvailableTitle"),
            updates.forceUpdate
              ? translate("updateApp.forceUpdateMessage")
              : translate("updateApp.updateAvailableMessage"),
            alertButtons,
          )
        }

        // Exercise update is done in MainNavigator on each app start
        // if (updates && updates.exercisesUpdateAvailable && authStore.isAuthenticated) {
        //   await exerciseStore.getAllExercises()
        // }

        // Set last updated timestamp only if successful
        // await storage.setAppLastUpdated()
      } catch (e) {
        console.warn("AppNavigator.checkForUpdates failed:", e)
        setCheckUpdateError(true)
      }
    }
    checkForUpdates()

    // Refresh authentication status by freshing token
    // Not sure if this is necessary
    // authStore.refreshAuthToken()

    // onAuthStateChanged is fired upon app initialization as well
    const unsubscribeAuthChange = auth().onAuthStateChanged(onAuthStateChanged)

    // Check for updates when app is resumed
    const subscribeAppStateChange = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.debug("AppNavigator.subscribeAppStateChange: app resumed")
        checkForUpdates()
      }
    })

    return () => {
      unsubscribeAuthChange()
      subscribeAppStateChange.remove()
    }
  }, [])

  useEffect(() => {
    if (checkUpdateError) {
      Alert.alert(
        translate("common.error.unknownErrorMessage"),
        translate("updateApp.checkForUpdateErrorMessage"),
        [
          {
            text: translate("common.ok"),
            onPress: () => {},
            style: "cancel",
          },
        ],
      )
    }
  }, [checkUpdateError])

  const setInitialRouteName = useCallback(() => {
    return forceUpdate
      ? "AppDisabled"
      : authStore.isAuthenticated
      ? "MainNavigator"
      : "AuthNavigator"
  }, [forceUpdate, checkUpdateError, authStore.isAuthenticated])

  const setStackScreen = useCallback(() => {
    return forceUpdate || isInitializing ? (
      <Stack.Screen name="AppDisabled" component={LoadingScreen} />
    ) : authStore.isAuthenticated ? (
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    ) : (
      <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
    )
  }, [forceUpdate, checkUpdateError, isInitializing, authStore.isAuthenticated])

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={setInitialRouteName()}
    >
      {setStackScreen()}
    </Stack.Navigator>
  )
})

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = observer((props: NavigationProps) => {
  const { userStore, themeStore, feedStore } = useStores()
  const systemColorScheme = useColorScheme() // Initial system color scheme
  const [isInternetConnectState, setIsInternetConnectState] = useState<boolean>()
  const [isInternetConnected] = useInternetStatus()
  const [showToastTx] = useToast()
  const [_, setLocale] = useLocale()

  const userLocale = userStore.getUserPreference<AppLocale>("appLocale")
  const userColorScheme = userStore.getUserPreference<AppColorScheme>("appColorScheme")

  // Set initial theme and react to system and user preference changes
  useEffect(() => {
    console.debug("AppNavigator.useEffect colorScheme change:", {
      systemColorScheme,
      userColorScheme,
    })

    // Update theme store
    themeStore.setProp("systemColorScheme", systemColorScheme)
    themeStore.setProp("appColorScheme", userColorScheme)

    setStatusBarStyle(themeStore.isDark ? "light" : "dark", true)
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(themeStore.colors("background"))
      NavigationBar.setButtonStyleAsync(themeStore.isDark ? "light" : "dark")
    }
  }, [systemColorScheme, userColorScheme])

  // Set app locale
  useEffect(() => {
    console.debug("AppNavigator.useEffect userLocale change:", { userLocale })
    setLocale(userLocale)
  }, [userLocale])

  useEffect(() => {
    const handleNetworkChange = (newIsInternetConnected: boolean) => {
      if (newIsInternetConnected) {
        console.debug("AppNavigator.useEffect [isInternetConnect]: Internet connected")
        showToastTx("common.offlineMode.firestoreNetworkEnabledMessage")
        firestore()
          .waitForPendingWrites()
          .then(() => {
            // showToastTx("common.offlineMode.pendingWritesSuccessMessage")
          })
          .catch(() => {
            showToastTx("common.offlineMode.pendingWritesFailedMessage")
          })
          .finally(() => {})

        feedStore.syncLocalUserWorkouts().then((receipts) => {
          if (receipts.length > 0) {
            showToastTx("common.offlineMode.localWorkoutsSyncedMessage")
          }
        })
      } else {
        console.debug("AppNavigator.useEffect [isInternetConnect]: Internet disconnected")
        showToastTx("common.offlineMode.firestoreNetworkDisabledMessage")
      }
    }

    // Update state but don't do anything on initial undefined state
    setIsInternetConnectState(isInternetConnected)
    if (isInternetConnectState !== undefined) {
      handleNetworkChange(isInternetConnected)
    }
  }, [isInternetConnected])

  const envMode = Constants.expoConfig?.extra?.gymrappEnvironment

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: darkColors.tint,
      background: darkColors.background,
      card: darkColors.contentBackground,
      text: darkColors.text,
      border: darkColors.border,
      notification: darkColors.contentBackground,
    },
  }

  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: lightColors.tint,
      background: lightColors.background,
      card: lightColors.contentBackground,
      text: lightColors.text,
      border: lightColors.border,
      notification: lightColors.contentBackground,
    },
  }

  const $topSafeAreaInset = useSafeAreaInsetsStyle(["top"], "margin")
  const $internetStatusBar: StyleProp<ViewStyle> = {
    position: "absolute",
    zIndex: 1,
    top: $topSafeAreaInset.marginTop,
    left: 0,
    right: 0,
    height: spacing.screenPadding,
    backgroundColor: themeStore.colors("danger"),
    alignItems: "center",
    justifyContent: "center",
  }
  const $devModStatusBar: StyleProp<ViewStyle> = {
    position: "absolute",
    zIndex: 1,
    top: $topSafeAreaInset.marginTop,
    left: 0,
    right: 0,
    height: spacing.screenPadding,
    backgroundColor:
      envMode === "production"
        ? themeStore.colors("danger")
        : themeStore.colors("contentBackground"),
    alignItems: "center",
    justifyContent: "center",
  }

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={themeStore.isDark ? darkTheme : lightTheme}
      {...props}
    >
      {__DEV__ && (
        <RowView style={$devModStatusBar}>
          <Icon name="alert-circle-outline" size={14} />
          <Spacer type="horizontal" size="tiny" />
          <Text
            text={
              "DEV mode! " +
              (envMode === "production"
                ? "WARNING! Connected to Firebase PROD!!!"
                : process.env.EXPO_PUBLIC_USE_EMULATOR === "0"
                ? "Connected to Firebase test"
                : "Connected to emulator")
            }
            size="xxs"
          />
        </RowView>
      )}
      {!isInternetConnected && (
        <RowView style={$internetStatusBar}>
          <Icon name="cloud-offline" size={14} />
          <Spacer type="horizontal" size="tiny" />
          <Text tx="common.error.networkErrorMessage" size="xxs" />
        </RowView>
      )}
      <AppStack />
    </NavigationContainer>
  )
})
