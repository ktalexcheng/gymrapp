import { ExerciseSettings } from "app/data/model"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { HStack, Menu, Popover, Pressable, Switch } from "native-base"
import React, { FC, useState } from "react"
import { View } from "react-native"
import { Icon, Text, WheelPickerFlat } from "../../components"
import { useStores } from "../../stores"
import { DefaultExerciseSettings } from "./defaultExerciseSettings"

export type ExerciseSettingsProps = {
  exerciseOrder: number
  exerciseId: string
  exerciseSettings: ExerciseSettings
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = (props: ExerciseSettingsProps) => {
  const [page, setPage] = useState("")
  const [restTimeIndex, setRestTimeIndex] = useState(
    Math.trunc((props.exerciseSettings?.restTime ?? DefaultExerciseSettings.restTime) / 5) - 1,
  )
  const { workoutStore, exerciseStore } = useStores()
  const [restTimeList, _] = useState<{ label: string; value: number }[]>(
    Array(60)
      .fill(null)
      .map<any>((_, i) => {
        const seconds = (i + 1) * 5
        return {
          label: formatSecondsAsTime(seconds),
          value: seconds,
        }
      }),
  )
  const [restTimerEnabled, setRestTimerEnabled] = useState(
    props.exerciseSettings?.autoRestTimerEnabled ?? false,
  )

  // function loadRestTimeList() {
  //   const count = restTimeList.length
  //   const newRestTimeList = [...restTimeList]
  //   const _newRestTimeList = Array(60)
  //     .fill(null)
  //     .map((_, i) => {
  //       const seconds = (count + i + 1) * 5
  //       return {
  //         label: formatDuration(moment.duration(seconds, "s"), false),
  //         value: seconds,
  //       }
  //     })
  //   newRestTimeList.push(..._newRestTimeList)
  //   setRestTimeList(newRestTimeList)
  // }

  function updateRestTimerEnabled(status: boolean) {
    console.debug("ExerciseId", props.exerciseId, "Rest time toggled:", status)
    exerciseStore.updateExerciseSetting(props.exerciseId, "autoRestTimerEnabled", status)
    setRestTimerEnabled(status)
  }

  function updateRestTime(index: number) {
    console.debug("ExerciseId", props.exerciseId, "Rest time selected:", restTimeList[index].value)
    exerciseStore.updateExerciseSetting(props.exerciseId, "restTime", restTimeList[index].value)
    setRestTimeIndex(index)
  }

  function removeExercise() {
    workoutStore.removeExercise(props.exerciseOrder)
  }

  return (
    <Popover
      placement="bottom right"
      trigger={(triggerProps) => {
        return (
          <Pressable accessibilityLabel="Exercise settings" {...triggerProps}>
            <Icon name="ellipsis-vertical" size={24} />
          </Pressable>
        )
      }}
    >
      <Popover.Content width="170">
        {page === "" && (
          <Popover.Body>
            <Menu.Item
              onPress={() => {
                setPage("timer")
              }}
            >
              Rest Time
            </Menu.Item>
            <Menu.Item>Create superset</Menu.Item>
            <Menu.Item onPress={removeExercise}>Remove exercise</Menu.Item>
          </Popover.Body>
        )}
        {page === "timer" && (
          <Popover.Body>
            <Icon
              name="arrow-back"
              size={24}
              onPress={() => {
                setPage("")
              }}
            />
            <HStack justifyContent="space-between">
              <Text tx="exerciseEntrySettings.restTimerEnabledLabel" />
              <Switch
                isChecked={restTimerEnabled}
                onToggle={() => {
                  updateRestTimerEnabled(!restTimerEnabled)
                }}
              />
            </HStack>
            <View>
              <WheelPickerFlat
                enabled={restTimerEnabled}
                items={restTimeList}
                onIndexChange={updateRestTime}
                itemHeight={30}
                initialScrollIndex={restTimeIndex}
              />
            </View>
          </Popover.Body>
        )}
      </Popover.Content>
    </Popover>
  )
}
