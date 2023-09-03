import { Button, RowView, Screen, Spacer, Text, TextField } from "app/components"
import { useStores } from "app/stores"
import { colors, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

export const RestTimerScreen: FC = observer(() => {
  const progressCircleLength = 1000
  const progressCircleRadius = progressCircleLength / (2 * Math.PI)
  const progressCircleViewBoxSize = progressCircleRadius * 2 + 50
  const progressCircleViewBox = `0 0 ${progressCircleViewBoxSize} ${progressCircleViewBoxSize}`
  const progressCircleStrokeWidthOuter = 15
  const progressCircleStrokeWidthInner = 10

  const { workoutStore } = useStores()
  const AnimatedCircle = Animated.createAnimatedComponent(Circle)

  const [timerMinutes, setTimerMinutes] = useState(Math.floor(workoutStore.restTime / 60))
  const [timerSeconds, setTimerSeconds] = useState(workoutStore.restTime % 60)
  const timerRemaining = useSharedValue(workoutStore.restTimeRemaining)
  const timerAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      progressCircleLength *
      ((workoutStore.restTime - timerRemaining.value) / workoutStore.restTime),
  }))

  useEffect(() => {
    if (workoutStore.restTimeRunning) startAnimation()
  }, [workoutStore.restTimeRunning])

  useEffect(() => {
    setTimerMinutes(Math.floor(workoutStore.restTime / 60))
    setTimerSeconds(workoutStore.restTime % 60)
    // If the timer is running and being adjusted in real time
    // we need to update the timerRemaining shared value
    // and restart the animation
    timerRemaining.value = workoutStore.restTimeRemaining
    if (workoutStore.restTimeRunning) startAnimation()
  }, [workoutStore.restTime])

  const startAnimation = () => {
    timerRemaining.value = withTiming(0, {
      duration: workoutStore.restTimeRemaining * 1000,
      easing: Easing.linear,
    })
  }

  const startTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds
    if (totalSeconds === 0) return

    timerRemaining.value = totalSeconds
    workoutStore.setRestTime(totalSeconds)
    workoutStore.startRestTimer()
  }

  const resetTimer = () => {
    workoutStore.resetRestTimer()
    timerRemaining.value = workoutStore.restTime
  }

  const handleMinutesChange = (value: string) => {
    const minutes = parseInt(value)
    if (minutes >= 0 && minutes <= 99) {
      setTimerMinutes(minutes)
    } else {
      setTimerMinutes(0)
    }
  }

  const handleSecondsChange = (value: string) => {
    const seconds = parseInt(value)
    if (seconds >= 0 && seconds <= 60) {
      setTimerSeconds(seconds)
    } else if (seconds > 60) {
      setTimerSeconds(60)
    } else {
      setTimerSeconds(0)
    }
  }

  const adjustRestTime = (seconds: number) => {
    workoutStore.adjustRestTime(seconds)
  }

  return (
    <Screen safeAreaEdges={["bottom"]} preset="fixed" contentContainerStyle={styles.flex1}>
      <View style={[styles.flex2, $timerAnimationContainer]}>
        <Svg height="100%" width="100%" viewBox={progressCircleViewBox}>
          <Circle
            cx={progressCircleViewBoxSize / 2}
            cy={progressCircleViewBoxSize / 2}
            r={progressCircleRadius}
            stroke={colors.border}
            strokeWidth={progressCircleStrokeWidthOuter}
          />
          <AnimatedCircle
            cx={progressCircleViewBoxSize / 2}
            cy={progressCircleViewBoxSize / 2}
            r={progressCircleRadius}
            stroke={colors.tint}
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
      <View style={[styles.flex1, $timerControls]}>
        <RowView style={$timerManualInput}>
          <Button
            preset="text"
            tx="restTimerScreen.subtract15Seconds"
            onPress={() => adjustRestTime(-15)}
          />
          <TextField
            containerStyle={$timerInputContainer}
            textAlign="center"
            placeholder="00"
            value={timerMinutes.toString().padStart(2, "0")}
            maxLength={2}
            onChangeText={handleMinutesChange}
          />
          <Text>:</Text>
          <TextField
            containerStyle={$timerInputContainer}
            textAlign="center"
            placeholder="00"
            value={timerSeconds.toString().padStart(2, "0")}
            maxLength={2}
            onChangeText={handleSecondsChange}
          />
          <Button
            preset="text"
            tx="restTimerScreen.add15Seconds"
            onPress={() => adjustRestTime(15)}
          />
        </RowView>
        <Spacer type="vertical" size="large" />
        <RowView>
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
        </RowView>
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
}

const $timerInputContainer: ViewStyle = {
  width: 50,
}

const $timerManualInput: ViewStyle = {
  alignItems: "center",
}
