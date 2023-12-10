import { Screen } from "app/components"
import React from "react"
import { Text, ViewStyle } from "react-native"

export const UpcomingScreen = () => {
  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text>UpcomingScreen</Text>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}
