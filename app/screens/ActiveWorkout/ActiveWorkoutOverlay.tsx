import { Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { colors } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

export const ActiveWorkoutOverlay = () => {
  const { workoutStore } = useStores()
  const [timeElapsed, setTimeElapsed] = useState("00:00:00")
  const navigation = useMainNavigation()
  const $containerInsets = useSafeAreaInsetsStyle(["top"], "margin")

  // Using MobX observer and useEffect will not work for some reason
  useEffect(() => {
    // if (workoutStore.inProgress) {
    const intervalId = setInterval(() => {
      // console.debug("ActiveWorkoutOverlay setInterval called")
      setTimeElapsed(workoutStore.timeElapsedFormatted)
    }, 1000)
    console.debug("ActiveWorkoutOverlay setInterval(): ", intervalId)

    return () => {
      console.debug("ActiveWorkoutOverlay clearInterval(): ", intervalId)
      clearInterval(intervalId)
    }
    // }
  }, [workoutStore.inProgress])

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
