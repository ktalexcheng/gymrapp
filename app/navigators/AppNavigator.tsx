/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import NetInfo from "@react-native-community/netinfo"
import auth from "@react-native-firebase/auth"
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { Icon, RowView, Spacer, Text } from "app/components"
import { AppColorScheme } from "app/data/constants"
import { translate } from "app/i18n"
import { LoadingScreen } from "app/screens"
import { api } from "app/services/api"
import { spacing } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import * as NavigationBar from "expo-navigation-bar"
import { setStatusBarStyle } from "expo-status-bar"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"
import {
  Alert,
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
  const [initializing, setInitializing] = useState(true) // Set an initializing state whilst Firebase connects

  // Handle user state changes
  async function onAuthStateChanged(user) {
    // Update authentication and user data
    if (user) {
      console.debug("onAuthStateChanged received valid user")
      authStore.setFirebaseUser(user)
      userStore.loadUserWithId(authStore.userId)
      feedStore.setUserId(authStore.userId)
    } else {
      console.debug("onAuthStateChanged received invalid user, invalidating session")
      authStore.invalidateSession()
      userStore.invalidateSession()
      feedStore.resetFeed()
    }

    if (initializing) setInitializing(false)
  }

  useEffect(() => {
    // Check for updates
    const checkForUpdates = async () => {
      try {
        const updates = await api.checkForUpdates(exerciseStore.lastUpdated)
        console.debug("AppNavigator.checkForUpdates response:", updates)
        setCheckUpdateError(false)

        if (updates && updates.updateAvailable) {
          if (updates.forceUpdate) {
            setForceUpdate(true)
          }

          Alert.alert(
            updates.forceUpdate
              ? translate("updateApp.forceUpdateTitle")
              : translate("updateApp.updateAvailableTitle"),
            updates.forceUpdate
              ? translate("updateApp.forceUpdateMessage")
              : translate("updateApp.updateAvailableMessage"),
            [
              {
                text: translate("updateApp.update"),
                onPress: () => {
                  Linking.openURL(updates.updateLink)
                },
              },
              !updates.forceUpdate && {
                text: translate("common.cancel"),
                onPress: () => {},
                style: "cancel",
              },
            ],
          )
        }

        if (updates && updates.exercisesUpdateAvailable && authStore.isAuthenticated) {
          await exerciseStore.getAllExercises()
        }
      } catch (e) {
        console.warn("AppNavigator.checkForUpdates failed:", e)
        setCheckUpdateError(true)
      }
    }
    checkForUpdates()

    // Refresh authentication status by freshing token
    authStore.refreshAuth()

    // onAuthStateChanged is fired upon app initialization as well
    const unsubscribeAuthChange = auth().onAuthStateChanged(onAuthStateChanged)
    // Check for updates when app is resumed
    const subscriptionAppStateChange = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkForUpdates()
      }
    })

    return () => {
      unsubscribeAuthChange()
      subscriptionAppStateChange.remove()
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
    return forceUpdate || checkUpdateError
      ? "AppDisabled"
      : authStore.isAuthenticated
      ? "MainNavigator"
      : "AuthNavigator"
  }, [forceUpdate, checkUpdateError, authStore.isAuthenticated])

  const setStackScreen = useCallback(() => {
    return forceUpdate || checkUpdateError ? (
      <Stack.Screen name="AppDisabled" component={LoadingScreen} />
    ) : authStore.isAuthenticated ? (
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    ) : (
      <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
    )
  }, [forceUpdate, checkUpdateError, authStore.isAuthenticated])

  if (initializing) return null

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
  const { userStore, themeStore } = useStores()
  const systemColorScheme = useColorScheme() // Initial system color scheme
  const [isInternetConnected, setIsInternetConnected] = useState(true)

  // Set initial theme and react to system and user preference changes
  useEffect(() => {
    console.debug("AppNavigator.useEffect colorScheme:", systemColorScheme)
    // Get user color scheme preference
    const userColorScheme = userStore.getUserPreference<AppColorScheme>("appColorScheme")

    // Update theme store
    themeStore.setProp("systemColorScheme", systemColorScheme)
    themeStore.setProp("appColorScheme", userColorScheme)

    setStatusBarStyle(themeStore.isDark ? "light" : "dark")
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(themeStore.colors("background"))
      NavigationBar.setButtonStyleAsync(themeStore.isDark ? "light" : "dark")
    }
  }, [systemColorScheme, userStore.getUserPreference("appColorScheme")])

  useEffect(() => {
    // Listen to network state change
    const unsubscribeNetworkChange = NetInfo.addEventListener((state) => {
      console.debug("AppNavigator.useEffect NetInfo", state)
      setIsInternetConnected(state.isConnected)
    })

    return () => {
      unsubscribeNetworkChange()
    }
  }, [])

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
  const $internetStatusBarInset: StyleProp<ViewStyle> = {
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

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={themeStore.isDark ? darkTheme : lightTheme}
      {...props}
    >
      {!isInternetConnected && (
        <RowView style={$internetStatusBarInset}>
          <Icon name="alert-circle-outline" size={14} />
          <Spacer type="horizontal" size="tiny" />
          <Text tx="common.error.networkErrorMessage" size="xxs" />
        </RowView>
      )}
      <AppStack />
    </NavigationContainer>
  )
})
