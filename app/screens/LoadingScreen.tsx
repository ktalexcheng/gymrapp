import React from "react"
import { ActivityIndicator, Text, ViewStyle } from "react-native"
import { Screen } from "../components"

export const LoadingScreen = () => {
  return (
    <Screen style={$loadingScreen}>
      <ActivityIndicator size="large" />
      <Text>LoadingScreen</Text>
    </Screen>
  )
}

const $loadingScreen: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}
