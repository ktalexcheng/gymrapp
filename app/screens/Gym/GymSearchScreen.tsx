import { Screen, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { spacing } from "app/theme"
import React from "react"
import { ViewStyle } from "react-native"
import { GymSearchBar } from "./GymSearchBar"

export const GymSearchScreen = () => {
  const mainNavigator = useMainNavigation()

  return (
    <Screen safeAreaEdges={["bottom"]} style={$container}>
      <Text preset="subheading" tx="gymSearchScreen.gymSearchTitle" />
      <GymSearchBar
        onPressResultItemCallback={(gym) => () =>
          mainNavigator.navigate("GymDetails", { gymId: gym.gymId })}
      />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}
