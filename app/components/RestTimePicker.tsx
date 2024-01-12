import { formatSecondsAsTime } from "app/utils/formatTime"
import React from "react"
import { WheelPickerFlat } from "./WheelPicker"

const restTimeList = Array(60)
  .fill(null)
  .map<any>((_, i) => {
    const seconds = (i + 1) * 5
    return {
      label: formatSecondsAsTime(seconds),
      value: seconds,
    }
  })

type RestTimePickerProps = {
  initialRestTime: number
  onRestTimeChange: (restTime: number) => void
  disabled?: boolean
}

export const RestTimePicker = (props: RestTimePickerProps) => {
  const { initialRestTime: restTime, onRestTimeChange, disabled } = props

  function updateRestTime(index: number) {
    onRestTimeChange(restTimeList[index].value)
  }

  return (
    <WheelPickerFlat
      disabled={disabled}
      items={restTimeList}
      onIndexChange={updateRestTime}
      itemHeight={40}
      initialScrollIndex={restTime / 5 - 1}
    />
  )
}
