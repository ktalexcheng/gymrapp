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
import { useLocale } from "app/context"
import { AppColorScheme, AppLocale } from "app/data/constants"
import { LoadingScreen } from "app/features/common/LoadingScreen"
import { useUpdateUser } from "app/features/UserProfile/services/useUpdateUser"
import { getExpoDevicePushToken } from "app/features/UserProfile/utils/getDevicePushToken"
import { useInternetStatus, useToast } from "app/hooks"
import { spacing } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import Constants from "expo-constants"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"
import { StyleProp, ViewStyle, useColorScheme } from "react-native"
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
  const { authenticationStore: authStore, themeStore, userStore } = useStores()
  const { setLocale } = useLocale()
  const systemColorScheme = useColorScheme() // Initial system color scheme

  const setInitialRouteName = useCallback(() => {
    return authStore.isAuthenticated ? "MainNavigator" : "AuthNavigator"
  }, [authStore.isAuthenticated])

  const setStackScreen = useCallback(() => {
    if (__DEV__ && authStore.isAuthenticated && Config.persistNavigation === "dev") {
      // For development, we will put all screens in the stack to support state persistence
      // In production, we will only have the appropriate screen based on the user's authentication state
      return (
        <>
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
          <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        </>
      )
    }

    return authStore.isAuthenticated ? (
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    ) : (
      <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
    )
  }, [authStore.isAuthenticated])

  useEffect(() => {
    themeStore.setProp("systemColorScheme", systemColorScheme as AppColorScheme)

    // Only sync user theme and locale preferences when the user is authenticated
    if (authStore.isAuthenticated && userStore.user) {
      const userLocale = userStore.getUserPreference<AppLocale>("appLocale")
      const userColorScheme = userStore.getUserPreference<AppColorScheme>("appColorScheme")

      console.debug("AppNavigator.useEffect updating user locale and color scheme:", {
        userLocale,
        userColorScheme,
      })
      setLocale(userLocale)
      themeStore.setAppColorScheme(userColorScheme)
    } else {
      themeStore.setAppColorScheme(AppColorScheme.Auto)
    }
  }, [authStore.isAuthenticated, userStore.user, systemColorScheme])

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, headerBackButtonMenuEnabled: false }}
      initialRouteName={setInitialRouteName()}
    >
      {setStackScreen()}
    </Stack.Navigator>
  )
})

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = observer((props: NavigationProps) => {
  // hooks
  const {
    authenticationStore: authStore,
    userStore,
    themeStore,
    feedStore,
    activeWorkoutStore,
    workoutEditorStore,
  } = useStores()
  const [isInternetConnected] = useInternetStatus()
  const [showToastTx] = useToast()

  // queries
  const updateUser = useUpdateUser()

  // states
  const [isInternetConnectState, setIsInternetConnectState] = useState<boolean>()
  const [isInitializing, setIsInitializing] = useState(true) // To prevent initial route flicker

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

  // Handle user state changes
  async function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    // Update authentication and user data
    console.debug("onAuthStateChanged triggered", { user })
    if (user) {
      console.debug("onAuthStateChanged received valid user")
      authStore.setFirebaseUser(user)
      console.debug("onAuthStateChanged user is email verified")
      await userStore.loadUserWithId(user.uid)

      // Once user is authenticated, save the user's device token for push notifications
      const expoPushToken = await getExpoDevicePushToken()
      if (expoPushToken) {
        updateUser.mutate({ userId: user.uid, expoPushToken })
      }
    } else {
      console.debug("onAuthStateChanged received invalid user, invalidating session")
      authStore.resetAuthStore()
      userStore.invalidateSession()
      feedStore.resetFeed()
      activeWorkoutStore.resetWorkout()
      workoutEditorStore.resetWorkout()
    }

    // This is to prevent the initial route flicker when the app is first loaded and auth state refreshes
    setIsInitializing(false)
  }

  useEffect(() => {
    // onAuthStateChanged is fired upon app initialization as well
    const unsubscribeAuthChange = auth().onAuthStateChanged(onAuthStateChanged)

    return () => {
      unsubscribeAuthChange()
    }
  }, [])

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

  if (isInitializing) return <LoadingScreen />

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
