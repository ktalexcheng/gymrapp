import {
  Divider,
  Icon,
  PickerModal,
  Popover,
  RestTimePicker,
  RowView,
  Spacer,
  Text,
} from "app/components"
import { WeightUnit } from "app/data/constants"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
import { IExercisePerformedModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { Platform, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from "react-native"
import { Switch } from "tamagui"

type MenuItemProps = TouchableOpacityProps & {
  closeMenu?: boolean
}

const MenuItem = (props: MenuItemProps) => {
  const { onPress, closeMenu = false, children } = props

  const BaseMenuItem = () => (
    <TouchableOpacity style={$menuItemContainer} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )

  if (closeMenu) {
    return (
      <Popover.Close>
        <BaseMenuItem />
      </Popover.Close>
    )
  }

  return <BaseMenuItem />
}

export type ExerciseSettingsProps = {
  exercise: IExercisePerformedModel
  exerciseSettings?: ExerciseSettings
  enableExerciseSettingsMenuItems?: Array<ExerciseSettingsType>
  onChangeExerciseSettings?: (
    exerciseId: string,
    settingItem: keyof ExerciseSettings,
    value: any,
  ) => void
  onRemoveExercise: (exerciseOrder: number) => void
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = observer(
  (props: ExerciseSettingsProps) => {
    const {
      exercise,
      enableExerciseSettingsMenuItems,
      onChangeExerciseSettings,
      onRemoveExercise,
    } = props
    const { exerciseId, exerciseOrder } = exercise

    const { themeStore } = useStores()
    const weightUnitSetting = useExerciseSetting<WeightUnit>(
      exerciseId,
      ExerciseSettingsType.WeightUnit,
    )
    const restTimerEnabledSetting = useExerciseSetting<boolean>(
      exerciseId,
      ExerciseSettingsType.AutoRestTimerEnabled,
    )
    const restTimeSetting = useExerciseSetting<number>(exerciseId, ExerciseSettingsType.RestTime)
    const [page, setPage] = useState("")

    const isSettingEnabled = (settingType: ExerciseSettingsType) => {
      return enableExerciseSettingsMenuItems?.some((i) => i === settingType)
    }

    function updateRestTimerEnabled(status: boolean) {
      onChangeExerciseSettings &&
        onChangeExerciseSettings(exerciseId, ExerciseSettingsType.AutoRestTimerEnabled, status)
    }

    function updateRestTime(restTime: number) {
      onChangeExerciseSettings &&
        onChangeExerciseSettings(exerciseId, ExerciseSettingsType.RestTime, restTime)
    }

    function updateWeightUnit(weightUnit: WeightUnit) {
      onChangeExerciseSettings &&
        onChangeExerciseSettings(exerciseId, ExerciseSettingsType.WeightUnit, weightUnit)
    }

    function removeExercise() {
      onRemoveExercise(exerciseOrder)
    }

    const renderPopoverContent = () => {
      if (!enableExerciseSettingsMenuItems || !onChangeExerciseSettings) return null

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
                  onCheckedChange={updateRestTimerEnabled}
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
                  <MenuItem
                    key={`exerciseSettingsMenu_${item}_${index}`}
                    onPress={() => updateWeightUnit(item)}
                  >
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
              {isSettingEnabled(ExerciseSettingsType.AutoRestTimerEnabled) && (
                <MenuItem
                  onPress={() => {
                    setPage("timer")
                  }}
                >
                  <Text tx="exerciseEntrySettings.restTimeLabel" />
                </MenuItem>
              )}
              {isSettingEnabled(ExerciseSettingsType.WeightUnit) && (
                <MenuItem
                  onPress={() => {
                    setPage("weightUnit")
                  }}
                >
                  <Text tx="exerciseEntrySettings.weightUnitLabel" />
                </MenuItem>
              )}
              {enableExerciseSettingsMenuItems?.length > 0 && (
                <Divider orientation="horizontal" spaceSize={spacing.extraSmall} />
              )}
              <MenuItem onPress={removeExercise}>
                <Text preset="danger" tx="exerciseEntrySettings.removeExerciseLabel" />
              </MenuItem>
            </>
          )
      }
    }

    return (
      <Popover trigger={<EllipsisVertical color={themeStore.colors("foreground")} />}>
        <View style={$menuContainer}>{renderPopoverContent()}</View>
      </Popover>
    )
  },
)

const $menuContainer: ViewStyle = {
  width: 160,
}

const $menuItemContainer: ViewStyle = {
  width: "100%",
  alignItems: "flex-start",
  paddingVertical: spacing.small,
}

const $checkmarkContainer = {
  width: 30,
}
