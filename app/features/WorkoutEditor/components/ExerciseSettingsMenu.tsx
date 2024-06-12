import {
  Divider,
  Icon,
  PickerModal,
  Popover,
  PopoverMenuItem,
  RestTimePicker,
  RowView,
  Spacer,
  Text,
} from "app/components"
import { WeightUnit } from "app/data/constants"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { useWeightUnitTx } from "app/hooks"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
import { translate } from "app/i18n"
import { IExercisePerformedModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { Platform, View, ViewStyle } from "react-native"
import { Switch } from "tamagui"

export type ExerciseSettingsProps = {
  exercise: IExercisePerformedModel
  exerciseSettings?: ExerciseSettings
  enableExerciseSettingsMenuItems?: Array<ExerciseSettingsType>
  onChangeExerciseSettings?: (
    exerciseId: string,
    settingItem: keyof ExerciseSettings,
    value: any,
  ) => void
  /**
   * This is not the actual function that handles replacing an exercise,
   * but a callback that runs when the user presses the "Replace Exercise" button
   */
  onPressReplaceExercise: () => void
  onRemoveExercise: (exerciseOrder: number) => void
}

export const ExerciseSettingsMenu: FC<ExerciseSettingsProps> = observer(
  (props: ExerciseSettingsProps) => {
    const {
      exercise,
      enableExerciseSettingsMenuItems,
      onChangeExerciseSettings,
      onPressReplaceExercise,
      onRemoveExercise,
    } = props
    const { exerciseId, exerciseOrder } = exercise

    const { themeStore } = useStores()
    const weightUnitSetting = useExerciseSetting<WeightUnit>(
      exerciseId,
      ExerciseSettingsType.WeightUnit,
    )
    const weightUnitTx = useWeightUnitTx(exerciseId)
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
              {Object.values(WeightUnit).map((item, index) => (
                <PopoverMenuItem
                  key={`exerciseSettingsMenu_${item}_${index}`}
                  itemNameLabel={WeightUnit[item]}
                  onPress={() => updateWeightUnit(item)}
                  OverrideRightAccessory={() =>
                    weightUnitSetting === item && <Icon name="checkmark-sharp" size={16} />
                  }
                />
              ))}
            </>
          )
        default:
          return (
            <>
              {isSettingEnabled(ExerciseSettingsType.AutoRestTimerEnabled) && (
                <PopoverMenuItem
                  itemNameLabelTx="exerciseEntrySettings.restTimeLabel"
                  currentValue={
                    restTimerEnabledSetting ? translate("common.on") : translate("common.off")
                  }
                  onPress={() => setPage("timer")}
                />
              )}
              {isSettingEnabled(ExerciseSettingsType.WeightUnit) && (
                <PopoverMenuItem
                  itemNameLabelTx="exerciseEntrySettings.weightUnitLabel"
                  currentValue={translate(weightUnitTx)}
                  onPress={() => {
                    setPage("weightUnit")
                  }}
                />
              )}
              <Popover.Close>
                <PopoverMenuItem
                  itemNameLabelTx="exerciseEntrySettings.replaceExerciseLabel"
                  currentValue={undefined}
                  onPress={onPressReplaceExercise}
                />
              </Popover.Close>
              <Divider orientation="horizontal" spaceSize={spacing.extraSmall} />
              <PopoverMenuItem
                itemNameLabelTx="exerciseEntrySettings.removeExerciseLabel"
                textColor={themeStore.colors("danger")}
                onPress={removeExercise}
              />
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
