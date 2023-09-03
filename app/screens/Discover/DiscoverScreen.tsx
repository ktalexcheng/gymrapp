import { Screen } from "app/components"
import React from "react"
import { Text, ViewStyle } from "react-native"

export const DiscoverScreen = () => {
  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <Text>DiscoverScreen</Text>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}
