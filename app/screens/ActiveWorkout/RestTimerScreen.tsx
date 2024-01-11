import {
  Button,
  RowView,
  Screen,
  Spacer,
  Text,
  WheelPickerFlat,
  WheelPickerRef,
} from "app/components"
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

const minutesPickerItems = Array.from(Array(60).keys()).map((_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}))

const secondsPickerItems = Array.from(Array(60).keys()).map((_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}))

export const RestTimerScreen: FC = observer(() => {
  const { workoutStore, themeStore } = useStores()
  const [timerMinutes, setTimerMinutes] = useState(Math.floor(workoutStore.restTime / 60))
  const [timerSeconds, setTimerSeconds] = useState(workoutStore.restTime % 60)
  const timerMinutesRef = useRef<WheelPickerRef>(null)
  const timerSecondsRef = useRef<WheelPickerRef>(null)

  // Timer figure and animation setup
  const progressCircleLength = 1000
  const progressCircleRadius = progressCircleLength / (2 * Math.PI)
  const progressCircleViewBoxSize = progressCircleRadius * 2 + 50
  const progressCircleViewBox = `0 0 ${progressCircleViewBoxSize} ${progressCircleViewBoxSize}`
  const progressCircleStrokeWidthOuter = 15
  const progressCircleStrokeWidthInner = 10
  const AnimatedCircle = Animated.createAnimatedComponent(Circle)
  const timerRemaining = useSharedValue(workoutStore.restTimeRemaining)
  const restTime = useSharedValue(workoutStore.restTime)
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
  }, [workoutStore.restTime])

  // Sync the timer with the store, with the store as the source of truth
  const syncTimerWithStore = () => {
    const minutes = Math.floor(workoutStore.restTime / 60)
    const seconds = workoutStore.restTime % 60
    console.debug("RestTimerScreen.useEffect", { minutes, seconds })
    setTimerMinutes(minutes)
    setTimerSeconds(seconds)
    timerMinutesRef.current.scrollToIndex(minutes)
    timerSecondsRef.current.scrollToIndex(seconds)

    timerRemaining.value = workoutStore.restTimeRemaining
    restTime.value = workoutStore.restTime

    if (workoutStore.restTimeRunning) startAnimation()
  }

  const updateRestTime = (totalSeconds: number) => {
    workoutStore.setRestTime(totalSeconds)
    timerRemaining.value = totalSeconds
    restTime.value = totalSeconds
  }

  const startAnimation = () => {
    timerRemaining.value = withTiming(0, {
      duration: workoutStore.restTimeRemaining * 1000,
      easing: Easing.linear,
    })
  }

  const startTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds
    if (totalSeconds > 0) {
      updateRestTime(totalSeconds)
      workoutStore.startRestTimer()
      startAnimation()
    }
  }

  const resetTimer = () => {
    workoutStore.resetRestTimer()
    cancelAnimation(timerRemaining)
    // syncTimerWithStore()
  }

  const adjustRestTime = (adjustBySeconds: number) => {
    workoutStore.adjustRestTime(adjustBySeconds)
    // syncTimerWithStore()
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
        <View style={$remainingTimeContainer}>
          <Text preset="subheading">{formatSecondsAsTime(workoutStore.restTime)}</Text>
          <Text>{formatSecondsAsTime(workoutStore.restTimeRemaining)}</Text>
        </View>
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
            <RowView style={styles.alignCenter}>
              <View style={styles.flex1}>
                <Text preset="light" tx="restTimerScreen.minutes" textAlign="center" />
              </View>
              <Spacer type="horizontal" size="tiny" />
              <Text weight="bold" text=":" visible={false} />
              <Spacer type="horizontal" size="tiny" />
              <View style={[styles.flex1, styles.justifyCenter]}>
                <Text preset="light" tx="restTimerScreen.seconds" textAlign="center" />
              </View>
            </RowView>
            <RowView style={styles.alignCenter}>
              <View style={styles.flex1}>
                <WheelPickerFlat
                  ref={timerMinutesRef}
                  items={minutesPickerItems}
                  onIndexChange={setTimerMinutes}
                  itemHeight={30}
                  initialScrollIndex={timerMinutes}
                />
              </View>
              <Spacer type="horizontal" size="tiny" />
              <Text weight="bold" text=":" />
              <Spacer type="horizontal" size="tiny" />
              <View style={styles.flex1}>
                <WheelPickerFlat
                  ref={timerSecondsRef}
                  items={secondsPickerItems}
                  onIndexChange={setTimerSeconds}
                  itemHeight={30}
                  initialScrollIndex={timerSeconds}
                />
              </View>
            </RowView>
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
            if (workoutStore.restTimeRunning) {
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
