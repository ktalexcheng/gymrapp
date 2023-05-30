import Ionicons from "@expo/vector-icons/Ionicons"
import { ExerciseSettings } from "app/data/model"
import moment from "moment"
import { HStack, Icon, Menu, Popover, Pressable, Switch } from "native-base"
import React, { FC, useState } from "react"
import { View } from "react-native"
import { Text, WheelPickerFlat } from "../../components"
import { useStores } from "../../stores"
import { formatDuration } from "./formatDuration"
export type ExerciseSettingsProps = {
  exerciseId: string
  exerciseSettings: ExerciseSettings
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = (props: ExerciseSettingsProps) => {
  // const navigation = useNavigation<NavigationProp<ActivityStackParamList>>()
  const [page, setPage] = useState("")
  const [restTimeIndex, setRestTimeIndex] = useState(
    Math.trunc(props.exerciseSettings?.restTime / 5) - 1 ?? 23,
  )
  const { exerciseStore } = useStores()
  const [restTimeList, _] = useState<{ label: string; value: number }[]>(
    Array(60)
      .fill(null)
      .map<any>((_, i) => {
        const seconds = (i + 1) * 5
        return {
          label: formatDuration(moment.duration(seconds, "s"), false),
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

  return (
    <Popover
      placement="bottom right"
      trigger={(triggerProps) => {
        return (
          <Pressable accessibilityLabel="Exercise settings" {...triggerProps}>
            <Icon as={Ionicons} name="ellipsis-vertical" size="lg" />
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
            <Menu.Item>Remove exercise</Menu.Item>
          </Popover.Body>
        )}
        {page === "timer" && (
          <Popover.Body>
            <Icon
              as={Ionicons}
              name="arrow-back"
              size="lg"
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
