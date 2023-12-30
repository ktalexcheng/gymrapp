import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { View } from "react-native"
import { RowView } from "./RowView"
import { Spacer } from "./Spacer"
import { Text } from "./Text"
import { WheelPickerFlat, WheelPickerRef } from "./WheelPicker"

const minutesPickerItems = Array.from(Array(60).keys()).map((_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}))

const secondsPickerItems = Array.from(Array(60).keys()).map((_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i,
}))

export type TimePickerRef = {
  scrollToTime: (timeAsSeconds: number) => void
}

export type TimePickerProps = {
  initialValue: number // time as seconds
  onValueChange: (timeAsSeconds: number) => void
}

const ExoticTimePicker = forwardRef<TimePickerRef, TimePickerProps>((props, ref) => {
  const { initialValue, onValueChange } = props
  const [timerMinutes, setTimerMinutes] = useState(Math.floor(initialValue / 60))
  const [timerSeconds, setTimerSeconds] = useState(initialValue % 60)
  const timerMinutesRef = useRef<WheelPickerRef>(null)
  const timerSecondsRef = useRef<WheelPickerRef>(null)
  useImperativeHandle(ref, () => ({
    scrollToTime: (timeAsSeconds: number) => {
      const minutes = Math.floor(timeAsSeconds / 60)
      const seconds = timeAsSeconds % 60
      timerMinutesRef.current.scrollToIndex(minutes)
      timerSecondsRef.current.scrollToIndex(seconds)
    },
  }))

  useEffect(() => {
    const totalSeconds = timerMinutes * 60 + timerSeconds
    onValueChange(totalSeconds)
  }, [timerMinutes, timerSeconds])

  return (
    <View>
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
  )
})
ExoticTimePicker.displayName = "ExoticTimePicker"

export const TimePicker = observer(ExoticTimePicker)
