import { Button, Modal, RowView, Spacer, Text, TimePicker } from "app/components"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { StyleProp, TextStyle, TouchableOpacity, ViewStyle } from "react-native"

type TimePickerModalProps = {
  time?: number
  onChangeTime: (value?: number) => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  disabled?: boolean
}

export const TimePickerModal = observer((props: TimePickerModalProps) => {
  const {
    time,
    onChangeTime,
    style: $styleOverride,
    textStyle: $textStyleOverride,
    disabled,
  } = props

  const { themeStore } = useStores()

  // States
  const [timeInput, setTimeInput] = useState(time)
  const [showTimeInput, setShowTimeInput] = useState(false)

  const updateTime = () => {
    if (timeInput) onChangeTime(timeInput)
    else onChangeTime(undefined)
  }

  const $timeColumn: ViewStyle = {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: themeStore.colors("border"),
  }

  return (
    <>
      <TouchableOpacity
        disabled={disabled}
        style={[$timeColumn, $styleOverride]}
        onPress={() => setShowTimeInput(true)}
      >
        <Text style={$textStyleOverride}>{time && formatSecondsAsTime(time)}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeInput}
        onRequestClose={() => setShowTimeInput(false)}
      >
        <Text tx="workoutEditor.exerciseSetHeaders.time" preset="formHelper" />
        <TimePicker initialValue={timeInput ?? 0} onValueChange={setTimeInput} />
        <Spacer type="vertical" size="medium" />
        <RowView style={styles.justifyCenter}>
          <Button
            preset="text"
            tx="common.ok"
            onPress={() => {
              updateTime()
              setShowTimeInput(false)
            }}
          />
          <Spacer type="horizontal" size="small" />
          <Button preset="text" tx="common.cancel" onPress={() => setShowTimeInput(false)} />
        </RowView>
      </Modal>
    </>
  )
})
