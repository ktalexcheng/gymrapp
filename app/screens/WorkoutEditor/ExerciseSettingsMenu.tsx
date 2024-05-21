import { WeightUnit } from "app/data/constants"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { Platform, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from "react-native"
import { Popover, Switch } from "tamagui"
import { Icon, PickerModal, RestTimePicker, RowView, Spacer, Text } from "../../components"
import { useStores } from "../../stores"

const MenuItem = (props: TouchableOpacityProps) => {
  const { onPress, children } = props

  return (
    <TouchableOpacity style={$menuItemContainer} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )
}

export type ExerciseSettingsProps = {
  mode: "active" | "editor"
  exerciseOrder: number
  exerciseId: string
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = observer(
  (props: ExerciseSettingsProps) => {
    const { mode, exerciseOrder, exerciseId } = props
    const { activeWorkoutStore, workoutEditorStore, exerciseStore, themeStore } = useStores()
    const isActiveWorkout = mode === "active"
    const workoutStore = isActiveWorkout ? activeWorkoutStore : workoutEditorStore
    const [weightUnitSetting] = useExerciseSetting<WeightUnit>(exerciseId, "weightUnit")
    const [restTimerEnabledSetting] = useExerciseSetting<boolean>(
      exerciseId,
      "autoRestTimerEnabled",
    )
    const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")
    const [page, setPage] = useState("")

    function updateRestTimerEnabled(status: boolean) {
      exerciseStore.updateExerciseSetting(exerciseId, "autoRestTimerEnabled", status)
    }

    function updateRestTime(restTime: number) {
      exerciseStore.updateExerciseSetting(exerciseId, "restTime", restTime)
    }

    function updateWeightUnit(weightUnit: WeightUnit) {
      exerciseStore.updateExerciseSetting(exerciseId, "weightUnit", weightUnit)
    }

    function removeExercise() {
      workoutStore.removeExercise(exerciseOrder)
    }

    const renderPopoverContent = () => {
      switch (page) {
        case "timer":
          return (
            <>
              <Icon
                name="arrow-back"
                size={24}
                onPress={() => {
                  setPage("")
                }}
              />
              <RowView style={[styles.justifyBetween, styles.alignCenter]}>
                <Text tx="exerciseEntrySettings.restTimerEnabledLabel" />
                <Switch
                  size="$3"
                  checked={restTimerEnabledSetting}
                  onCheckedChange={() => updateRestTimerEnabled(!restTimerEnabledSetting)}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </RowView>
              {Platform.select({
                android: (
                  <>
                    <Spacer type="vertical" size="small" />
                    <PickerModal
                      disabled={!restTimerEnabledSetting}
                      value={restTimeSetting}
                      onChange={updateRestTime}
                      itemsList={Array(60)
                        .fill(null)
                        .map<any>((_, i) => {
                          const seconds = (i + 1) * 5
                          return {
                            label: formatSecondsAsTime(seconds),
                            value: seconds,
                          }
                        })}
                      modalTitleTx={"exerciseEntrySettings.restTimeLabel"}
                    />
                  </>
                ),
                native: (
                  <RestTimePicker
                    disabled={!restTimerEnabledSetting}
                    initialRestTime={restTimeSetting}
                    onRestTimeChange={updateRestTime}
                  />
                ),
              })}
            </>
          )
        case "weightUnit":
          return (
            <>
              <Icon
                name="arrow-back"
                size={24}
                onPress={() => {
                  setPage("")
                }}
              />
              <View style={styles.fullWidth}>
                {Object.values(WeightUnit).map((item, index) => (
                  <MenuItem key={index} onPress={() => updateWeightUnit(item)}>
                    <RowView style={styles.alignCenter}>
                      <View style={$checkmarkContainer}>
                        {weightUnitSetting === item ? (
                          <Icon name="checkmark-sharp" size={16} />
                        ) : null}
                      </View>
                      <Text>{WeightUnit[item]}</Text>
                    </RowView>
                  </MenuItem>
                ))}
              </View>
            </>
          )
        default:
          return (
            <>
              {isActiveWorkout ? (
                <MenuItem
                  onPress={() => {
                    setPage("timer")
                  }}
                >
                  <Text tx="exerciseEntrySettings.restTimeLabel" />
                </MenuItem>
              ) : null}
              <MenuItem
                onPress={() => {
                  setPage("weightUnit")
                }}
              >
                <Text tx="exerciseEntrySettings.weightUnitLabel" />
              </MenuItem>
              <Spacer type="vertical" size="small" />
              <MenuItem onPress={removeExercise}>
                <Text preset="danger" tx="exerciseEntrySettings.removeExerciseLabel" />
              </MenuItem>
            </>
          )
      }
    }

    return (
      <Popover placement="bottom-end">
        <Popover.Trigger>
          <Icon name="ellipsis-vertical" size={24} />
        </Popover.Trigger>

        <Popover.Content
          unstyled
          style={themeStore.styles("menuPopoverContainer")}
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          // eslint-disable-next-line react-native/no-inline-styles
          enterStyle={{ y: -10, opacity: 0 }}
          // eslint-disable-next-line react-native/no-inline-styles
          exitStyle={{ y: -10, opacity: 0 }}
        >
          {renderPopoverContent()}
        </Popover.Content>
      </Popover>
    )
  },
)

const $menuItemContainer: ViewStyle = {
  width: "100%",
  alignItems: "flex-start",
  paddingVertical: spacing.small,
}

const $checkmarkContainer = {
  width: 30,
}
