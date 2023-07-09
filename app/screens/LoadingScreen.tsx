import React from "react"
import { Text, View, ViewStyle } from "react-native"

export const LoadingScreen = () => {
  return (
    <View style={$loadingScreen}>
      <Text>LoadingScreen</Text>
    </View>
  )
}

const $loadingScreen: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}
