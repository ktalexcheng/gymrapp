import { Screen, Text } from "app/components"
import { spacing } from "app/theme"
import React, { FC } from "react"
import { ViewStyle } from "react-native"

export const RestTimerScreen: FC = () => {
  const $container: ViewStyle = {
    padding: spacing.screen,
  }

  return (
    <Screen safeAreaEdges={["bottom"]} style={$container} preset="scroll">
      <Text>Rest Timer</Text>
    </Screen>
  )
}
