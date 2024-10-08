import { RowView, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

export const ActiveWorkoutOverlay = () => {
  const { activeWorkoutStore, themeStore } = useStores()
  const [timeElapsed, setTimeElapsed] = useState("00:00:00")
  const navigation = useMainNavigation()
  const $containerTopInset = useSafeAreaInsetsStyle(["top"], "margin")

  // Using MobX observer and useEffect will not work for some reason
  // @ts-ignore: Not all paths return a value
  useEffect(() => {
    if (activeWorkoutStore.inProgress) {
      const intervalId = setInterval(() => {
        setTimeElapsed(activeWorkoutStore.timeElapsedFormatted)
      }, 1000)
      console.debug("ActiveWorkoutOverlay setInterval called:", intervalId)

      return () => {
        console.debug("ActiveWorkoutOverlay clearInterval called:", intervalId)
        clearInterval(intervalId)
      }
    }
  }, [activeWorkoutStore.inProgress])

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
          <View style={styles.flex1}>
            <Text
              preset="light"
              textColor={themeStore.colors("actionableForeground")}
              tx="activeWorkoutScreen.ongoingWorkoutLabel"
            />
            <Text
              preset="subheading"
              numberOfLines={1}
              textColor={themeStore.colors("actionableForeground")}
              text={activeWorkoutStore.workoutTitle}
            />
          </View>
          <Text text={timeElapsed} textColor={themeStore.colors("actionableForeground")} />
        </RowView>
      </View>
    </TouchableOpacity>
  )
}
