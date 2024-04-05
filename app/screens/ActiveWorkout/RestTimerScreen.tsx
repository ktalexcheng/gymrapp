import { Button, RowView, Screen, Spacer, Text, TimePicker, TimePickerRef } from "app/components"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useRef, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

export const RestTimerScreen: FC = observer(() => {
  const { activeWorkoutStore, themeStore } = useStores()
  const timePickerRef = useRef<TimePickerRef>(null)
  const [timePickerValue, setTimePickerValue] = useState(activeWorkoutStore.restTime)

  // Timer figure and animation setup
  const progressCircleLength = 1000
  const progressCircleRadius = progressCircleLength / (2 * Math.PI)
  const progressCircleViewBoxSize = progressCircleRadius * 2 + 50
  const progressCircleViewBox = `0 0 ${progressCircleViewBoxSize} ${progressCircleViewBoxSize}`
  const progressCircleStrokeWidthOuter = 15
  const progressCircleStrokeWidthInner = 10
  const AnimatedCircle = Animated.createAnimatedComponent(Circle)
  const timerRemaining = useSharedValue(activeWorkoutStore.restTimeRemaining)
  const restTime = useSharedValue(activeWorkoutStore.restTime)
  const timerAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      (progressCircleLength * (restTime.value - timerRemaining.value)) / restTime.value,
  }))

  // useAnimatedReaction(
  //   () => timerRemaining.value,
  //   (newValue, prevValue) => {
  //     console.log("timerRemaining.value changed from", prevValue, "to", newValue)
  //   },
  // )

  useEffect(() => {
    // Initialize the timer picker with the current rest time
    // and update the timer when the rest time changes
    syncTimerWithStore()
  }, [activeWorkoutStore.restTime])

  // Sync the timer with the store, with the store as the source of truth
  const syncTimerWithStore = () => {
    setTimePickerValue(activeWorkoutStore.restTime)
    timePickerRef.current?.scrollToTime(activeWorkoutStore.restTime)

    timerRemaining.value = activeWorkoutStore.restTimeRemaining
    restTime.value = activeWorkoutStore.restTime

    if (activeWorkoutStore.restTimeRunning) startAnimation()
  }

  const updateRestTime = (totalSeconds: number) => {
    activeWorkoutStore.setRestTime(totalSeconds)
    timerRemaining.value = totalSeconds
    restTime.value = totalSeconds
  }

  const startAnimation = () => {
    timerRemaining.value = withTiming(0, {
      duration: activeWorkoutStore.restTimeRemaining * 1000,
      easing: Easing.linear,
    })
  }

  const startTimer = () => {
    if (timePickerValue > 0) {
      updateRestTime(timePickerValue)
      activeWorkoutStore.startRestTimer()
      startAnimation()
    }
  }

  const resetTimer = () => {
    activeWorkoutStore.resetRestTimer()
    cancelAnimation(timerRemaining)
    timerRemaining.value = activeWorkoutStore.restTimeRemaining
  }

  const adjustRestTime = (adjustBySeconds: number) => {
    const adjustedTime = Math.max(0, timePickerValue + adjustBySeconds)
    timePickerRef.current?.scrollToTime(adjustedTime)
    activeWorkoutStore.adjustRestTime(adjustBySeconds)
    setTimePickerValue(adjustedTime)
  }

  return (
    // containerContainerStyle has padding missing on purpose to accurately calculate dimensions
    // for the timer animation
    <Screen safeAreaEdges={["bottom"]} preset="fixed" contentContainerStyle={styles.flex1}>
      <View style={[styles.flex3, $timerAnimationContainer]}>
        <Svg
          height="100%"
          width="100%"
          viewBox={progressCircleViewBox}
          fill={themeStore.colors("transparent")}
        >
          <Circle
            cx={progressCircleViewBoxSize / 2}
            cy={progressCircleViewBoxSize / 2}
            r={progressCircleRadius}
            stroke={themeStore.colors("border")}
            strokeWidth={progressCircleStrokeWidthOuter}
          />
          <AnimatedCircle
            cx={progressCircleViewBoxSize / 2}
            cy={progressCircleViewBoxSize / 2}
            r={progressCircleRadius}
            stroke={themeStore.colors("tint")}
            strokeWidth={progressCircleStrokeWidthInner}
            strokeDasharray={progressCircleLength}
            animatedProps={timerAnimatedProps}
            strokeLinecap="round"
            transform={`rotate(-90, ${progressCircleViewBoxSize / 2}, ${
              progressCircleViewBoxSize / 2
            })`}
          />
        </Svg>
        {activeWorkoutStore.restTimeCompleted ? (
          <View style={$remainingTimeContainer}>
            <Text preset="subheading" tx="restTimerScreen.timesUpMessage" />
          </View>
        ) : (
          <View style={$remainingTimeContainer}>
            <Text preset="subheading">{formatSecondsAsTime(activeWorkoutStore.restTime)}</Text>
            <Text>{formatSecondsAsTime(activeWorkoutStore.restTimeRemaining)}</Text>
          </View>
        )}
      </View>
      <View style={[styles.flex2, $timerControls]}>
        <RowView style={$timerManualInput}>
          <View style={styles.flex2}>
            <Button
              preset="text"
              tx="restTimerScreen.subtract15Seconds"
              onPress={() => adjustRestTime(-15)}
            />
          </View>
          <View style={styles.flex3}>
            <TimePicker
              ref={timePickerRef}
              initialValue={timePickerValue}
              onValueChange={setTimePickerValue}
            />
          </View>
          <View style={styles.flex2}>
            <Button
              preset="text"
              tx="restTimerScreen.add15Seconds"
              onPress={() => adjustRestTime(15)}
            />
          </View>
        </RowView>
        <Spacer type="vertical" size="large" />
        <View style={$startStopButton}>
          {(() => {
            if (activeWorkoutStore.restTimeRunning) {
              return (
                <Button preset="default" tx="restTimerScreen.resetTimer" onPress={resetTimer} />
              )
            } else {
              return (
                <Button preset="default" tx="restTimerScreen.startTimer" onPress={startTimer} />
              )
            }
          })()}
        </View>
      </View>
    </Screen>
  )
})

const $timerAnimationContainer: ViewStyle = {
  justifyContent: "center",
  alignItems: "center",
}

const $remainingTimeContainer: ViewStyle & TextStyle = {
  position: "absolute",
  alignItems: "center",
}

const $timerControls: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: spacing.screenPadding,
}

const $timerManualInput: ViewStyle = {
  justifyContent: "space-around",
  alignItems: "center",
}

const $startStopButton: ViewStyle = {
  width: "100%",
}
