import { WeightUnit } from "app/data/constants"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
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
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = observer(
  (props: ExerciseSettingsProps) => {
    const { exerciseId } = props
    const { workoutStore, exerciseStore } = useStores()
    const [weightUnitSetting] = useExerciseSetting<WeightUnit>(exerciseId, "weightUnit")
    const [restTimerEnabledSetting] = useExerciseSetting<boolean>(
      exerciseId,
      "autoRestTimerEnabled",
    )
    const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")
    const [page, setPage] = useState("")

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
      exerciseStore.updateExerciseSetting(exerciseId, "autoRestTimerEnabled", status)
    }

    function updateRestTime(index: number) {
      exerciseStore.updateExerciseSetting(exerciseId, "restTime", restTimeList[index].value)
    }

    function updateWeightUnit(weightUnit: WeightUnit) {
      exerciseStore.updateExerciseSetting(exerciseId, "weightUnit", weightUnit)
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
                        isChecked={restTimerEnabledSetting}
                        onToggle={() => {
                          updateRestTimerEnabled(!restTimerEnabledSetting)
                        }}
                      />
                    </HStack>
                    <View>
                      <WheelPickerFlat
                        enabled={restTimerEnabledSetting}
                        items={restTimeList}
                        onIndexChange={updateRestTime}
                        itemHeight={30}
                        initialScrollIndex={restTimeSetting / 5 - 1}
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
                              {weightUnitSetting === item ? (
                                <Icon name="checkmark" size={16} />
                              ) : null}
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
