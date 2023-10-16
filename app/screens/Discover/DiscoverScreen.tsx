import { Screen, Text } from "app/components"
import { spacing } from "app/theme"
import React from "react"
import { ViewStyle } from "react-native"

export const DiscoverScreen = () => {
  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <Text>DiscoverScreen</Text>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
  justifyContent: "center",
  alignItems: "center",
}
