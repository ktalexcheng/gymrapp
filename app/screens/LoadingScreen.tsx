import React from "react"
import { ActivityIndicator, Text, ViewStyle } from "react-native"
import { Screen } from "../components"

export const LoadingScreen = () => {
  return (
    <Screen contentContainerStyle={$loadingScreen}>
      <ActivityIndicator size="large" />
      <Text>LoadingScreen</Text>
    </Screen>
  )
}

const $loadingScreen: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}
