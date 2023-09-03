import { WeightUnit } from "app/data/constants"
import { DefaultExerciseSettings } from "app/data/model"
import { translate } from "app/i18n"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { observer } from "mobx-react-lite"
import { HStack, Menu, Popover, Pressable, Switch } from "native-base"
import React, { FC, useState } from "react"
import { FlatList, TouchableOpacity, View } from "react-native"
import { Icon, RowView, Text, WheelPickerFlat } from "../../components"
import { useStores } from "../../stores"

export type ExerciseSettingsProps = {
  exerciseOrder: number
  exerciseId: string
  // exerciseSettings: ExerciseSettings
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = observer(
  (props: ExerciseSettingsProps) => {
    const { workoutStore, exerciseStore, userStore } = useStores()
    const exerciseSettings = exerciseStore.allExercises.get(props.exerciseId).exerciseSettings
    const weightUnit =
      exerciseSettings?.weightUnit ??
      userStore.user?.preferences?.weightUnit ??
      DefaultExerciseSettings.weightUnit

    const [page, setPage] = useState("")
    const [restTimerEnabled, setRestTimerEnabled] = useState(
      exerciseSettings?.autoRestTimerEnabled ?? false,
    )
    const [restTimeIndex, setRestTimeIndex] = useState(
      Math.trunc((exerciseSettings?.restTime ?? DefaultExerciseSettings.restTime) / 5) - 1,
    )

    const restTimeList = Array(60)
      .fill(null)
      .map<any>((_, i) => {
        const seconds = (i + 1) * 5
        return {
          label: formatSecondsAsTime(seconds),
          value: seconds,
        }
      })

    function updateRestTimerEnabled(status: boolean) {
      console.debug("ExerciseId", props.exerciseId, "Rest time toggled:", status)
      exerciseStore.updateExerciseSetting(props.exerciseId, "autoRestTimerEnabled", status)
      setRestTimerEnabled(status)
    }

    function updateRestTime(index: number) {
      console.debug(
        "ExerciseId",
        props.exerciseId,
        "Rest time selected:",
        restTimeList[index].value,
      )
      exerciseStore.updateExerciseSetting(props.exerciseId, "restTime", restTimeList[index].value)
      setRestTimeIndex(index)
    }

    function updateWeightUnit(weightUnit: WeightUnit) {
      exerciseStore.updateExerciseSetting(props.exerciseId, "weightUnit", weightUnit)
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
          {(() => {
            switch (page) {
              case "timer":
                return (
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
                )

              case "weightUnit":
                return (
                  <Popover.Body>
                    <Icon
                      name="arrow-back"
                      size={24}
                      onPress={() => {
                        setPage("")
                      }}
                    />
                    <FlatList
                      data={[WeightUnit.kg, WeightUnit.lbs]}
                      renderItem={({ item }) => {
                        return (
                          <TouchableOpacity onPress={() => updateWeightUnit(item)}>
                            <RowView>
                              {weightUnit === item ? <Icon name="checkmark" size={16} /> : null}
                              <Text>{WeightUnit[item]}</Text>
                            </RowView>
                          </TouchableOpacity>
                        )
                      }}
                      keyExtractor={(item) => item}
                    />
                  </Popover.Body>
                )

              default:
                return (
                  <Popover.Body>
                    <Menu.Item
                      onPress={() => {
                        setPage("timer")
                      }}
                    >
                      {translate("exerciseEntrySettings.restTimeLabel")}
                    </Menu.Item>
                    <Menu.Item
                      onPress={() => {
                        setPage("weightUnit")
                      }}
                    >
                      {translate("exerciseEntrySettings.weightUnitLabel")}
                    </Menu.Item>
                    {/* <Menu.Item>{translate("exerciseEntrySettings.createSupersetLabel")}</Menu.Item> */}
                    <Menu.Item onPress={removeExercise}>
                      {translate("exerciseEntrySettings.removeExerciseLabel")}
                    </Menu.Item>
                  </Popover.Body>
                )
            }
          })()}
        </Popover.Content>
      </Popover>
    )
  },
)
