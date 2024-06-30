import { useStores } from "app/stores"
import { typography } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { ActivityIndicator, Platform, TextStyle, View, ViewStyle } from "react-native"
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

export interface LoadingIndicatorProps {
  type?: "logo" | "spinner"
  size?: ActivityIndicator["props"]["size"]
}

export const LoadingIndicator = observer((props: LoadingIndicatorProps) => {
  const { type = "spinner", size = "small" } = props
  const { themeStore } = useStores()

  const $logoText: TextStyle = {
    color: themeStore.colors("logo"),
    fontSize: 28,
    lineHeight: 38,
    fontFamily: typography.secondary.bold,
  }

  const $logoTextIos: TextStyle = {
    shadowColor: themeStore.colors("logo"), // ios
    shadowOpacity: 1, // ios
    shadowRadius: 5, // ios
  }

  const $logoTextAndroid: TextStyle = {
    // textShadowColor: themeStore.colors("logo"), // android: this is throwing error for some reason
    textShadowRadius: 20, // android
  }

  const $glowAnimation = useAnimatedStyle(() => {
    if (Platform.OS === "ios") {
      return {
        ...$logoText,
        ...$logoTextIos,
        shadowRadius: withRepeat(
          withSequence(withTiming(5, { duration: 1500 }), withTiming(30, { duration: 1000 })),
          -1, // -1 means repeat indefinitely
          true,
        ),
      }
    } else if (Platform.OS === "android") {
      return {
        ...$logoText,
        ...$logoTextAndroid,
        textShadowRadius: withRepeat(
          withSequence(withTiming(5, { duration: 1500 }), withTiming(10, { duration: 1000 })),
          -1, // -1 means repeat indefinitely
          true,
        ),
      }
    }

    return {}
  })

  return (
    <View style={$container}>
      {type === "logo" ? (
        <Animated.Text style={$glowAnimation}>GYMRAPP</Animated.Text>
      ) : (
        <ActivityIndicator size={size} color={themeStore.colors("logo")} />
      )}
    </View>
  )
})

const $container: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}
