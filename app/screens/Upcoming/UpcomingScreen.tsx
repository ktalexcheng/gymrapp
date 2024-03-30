import { Screen } from "app/components"
import { useStores } from "app/stores"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import React from "react"
import { Text, ViewStyle } from "react-native"

export const UpcomingScreen = () => {
  const { activeWorkoutStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress
    ? ["bottom"]
    : ["top", "bottom"]

  return (
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={$container}>
      <Text>UpcomingScreen</Text>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}
