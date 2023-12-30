import { RowView, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

export const ActiveWorkoutOverlay = () => {
  const { workoutStore, themeStore } = useStores()
  const [timeElapsed, setTimeElapsed] = useState("00:00:00")
  const navigation = useMainNavigation()
  const $containerTopInset = useSafeAreaInsetsStyle(["top"], "margin")

  // Using MobX observer and useEffect will not work for some reason
  // @ts-ignore
  useEffect(() => {
    if (workoutStore.inProgress) {
      const intervalId = setInterval(() => {
        setTimeElapsed(workoutStore.timeElapsedFormatted)
      }, 1000)
      console.debug("ActiveWorkoutOverlay setInterval called:", intervalId)

      return () => {
        console.debug("ActiveWorkoutOverlay clearInterval called:", intervalId)
        clearInterval(intervalId)
      }
    }
  }, [workoutStore.inProgress])

  function goToActiveWorkout() {
    navigation.navigate("ActiveWorkout")
  }

  const $activeActivityOverlay: ViewStyle = {
    zIndex: 1,
    backgroundColor: themeStore.colors("actionable"),
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.small,
  }

  return (
    <TouchableOpacity onPress={goToActiveWorkout}>
      <View style={[$containerTopInset, $activeActivityOverlay]}>
        <RowView style={[styles.alignCenter, styles.justifyBetween]}>
          <View style={styles.flex4}>
            <Text
              preset="light"
              textColor={themeStore.colors("actionableForeground")}
              tx="activeWorkoutScreen.ongoingWorkoutLabel"
            />
            <Text
              preset="subheading"
              numberOfLines={1}
              textColor={themeStore.colors("actionableForeground")}
              text={workoutStore.workoutTitle}
            />
          </View>
          <Text
            style={styles.flex1}
            text={timeElapsed}
            textColor={themeStore.colors("actionableForeground")}
          />
        </RowView>
      </View>
    </TouchableOpacity>
  )
}
