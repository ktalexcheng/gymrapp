import { Spacer, Text } from "app/components"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

type TimerProgressCircularProps = {
  circleDiameter: number
  strokeWidth: number
  totalTime: number
  remainingTime: number
  progressRt: SharedValue<number> // 0-1 indicating the progress of the timer (0 = start, 1 = end)
  set?: number
  totalSets?: number
  timerTitleTx?: TxKeyPath
  overlayMessageTx?: TxKeyPath
}

export type TimerProgressCircularRef = {
  startAnimation: (seconds: number, reset?: boolean) => void
  pauseAnimation: () => void
  resetAnimation: () => void
}

export const TimerProgressCircular = observer(
  React.forwardRef(function TimerProgressCircular(
    props: TimerProgressCircularProps,
    forwardedRef: React.Ref<TimerProgressCircularRef>,
  ) {
    const {
      circleDiameter,
      strokeWidth,
      totalTime,
      remainingTime,
      progressRt,
      set,
      totalSets,
      timerTitleTx,
      overlayMessageTx,
    } = props

    const { themeStore } = useStores()

    // Timer figure and animation setup
    const progressCircleRadius = circleDiameter / 2
    const progressCircleLength = circleDiameter * Math.PI
    const progressCircleViewBoxSize = progressCircleRadius * 2 + 50
    const progressCircleViewBox = `0 0 ${progressCircleViewBoxSize} ${progressCircleViewBoxSize}`
    const progressCircleStrokeWidthOuter = strokeWidth
    const progressCircleStrokeWidthInner = strokeWidth * 0.7
    const AnimatedCircle = Animated.createAnimatedComponent(Circle)
    const sharedRemainingTime = useSharedValue(totalTime)
    // const sharedTotalTime = useSharedValue(totalTime)
    // const timerAnimatedProps = useAnimatedProps(() => ({
    //   strokeDashoffset:
    //     (progressCircleLength * (sharedTotalTime.value - sharedRemainingTime.value)) /
    //     sharedTotalTime.value,
    // }))
    const timerAnimatedProps = useAnimatedProps(() => ({
      strokeDashoffset: progressCircleLength * progressRt.value,
    }))

    const startAnimation = (seconds: number, reset?: boolean) => {
      if (reset) resetAnimation()
      sharedRemainingTime.value = withTiming(0, {
        duration: seconds * 1000,
        easing: Easing.linear,
      })
    }

    const pauseAnimation = () => {
      cancelAnimation(sharedRemainingTime)
    }

    const resetAnimation = () => {
      cancelAnimation(sharedRemainingTime)
      sharedRemainingTime.value = remainingTime
    }

    React.useImperativeHandle(forwardedRef, () => ({
      startAnimation,
      pauseAnimation,
      resetAnimation,
    }))

    const $timerAnimationContainer: ViewStyle = {
      justifyContent: "center",
      alignItems: "center",
    }

    return (
      // containerContainerStyle has padding missing on purpose to accurately calculate dimensions
      // for the timer animation
      <View style={$timerAnimationContainer}>
        <Svg
          height={progressCircleViewBoxSize}
          width={progressCircleViewBoxSize}
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
            stroke={themeStore.colors("logo")}
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
          {overlayMessageTx ? (
            <Text preset="subheading" tx={overlayMessageTx} />
          ) : (
            <>
              {timerTitleTx && (
                <>
                  <Text preset="subheading" tx={timerTitleTx} />
                  <Spacer type="vertical" size="small" />
                </>
              )}
              <Text preset="subheading">{formatSecondsAsTime(totalTime)}</Text>
              <Text>{formatSecondsAsTime(remainingTime)}</Text>
              {set !== undefined && totalSets && (
                <>
                  <Spacer type="vertical" size="small" />
                  <Text tx="timer.currentSet" txOptions={{ set, totalSets }} />
                </>
              )}
            </>
          )}
        </View>
      </View>
    )
  }),
)

const $remainingTimeContainer: ViewStyle & TextStyle = {
  position: "absolute",
  alignItems: "center",
}
