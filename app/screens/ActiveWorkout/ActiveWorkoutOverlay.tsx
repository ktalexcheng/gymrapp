import { Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { colors } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import React from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { useTimeElapsed } from "./useTimeElapsed"

export const ActiveWorkoutOverlay = () => {
  const $containerInsets = useSafeAreaInsetsStyle(["top"], "margin")
  const timeElapsed = useTimeElapsed()
  const { workoutStore } = useStores()
  const navigation = useMainNavigation()

  function goToActiveWorkout() {
    navigation.navigate("ActiveWorkout")
  }

  return (
    workoutStore.inProgress && (
      <TouchableOpacity onPress={goToActiveWorkout}>
        <View style={[$containerInsets, $activeActivityOverlay]}>
          <Text preset="subheading">{workoutStore.workoutTitle}</Text>
          <Text text={timeElapsed} />
        </View>
      </TouchableOpacity>
    )
  )
}

const $activeActivityOverlay: ViewStyle = {
  zIndex: 1,
  backgroundColor: colors.actionable,
  justifyContent: "center",
}
