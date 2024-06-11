import { MenuListItem, RowView, Screen, Text } from "app/components"
import { WeightUnit } from "app/data/constants"
import { translate } from "app/i18n"
import { IExerciseModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React from "react"
import { FlatList, View, ViewStyle } from "react-native"

const ExerciseSettingsTile = (exercise: IExerciseModel) => {
  const { themeStore } = useStores()

  const autoRestTimerEnabled = exercise.exerciseSettings?.autoRestTimerEnabled
  const restTime = exercise.exerciseSettings?.restTime
  const weightUnit = exercise.exerciseSettings?.weightUnit

  let autoRestTimeSettingSummary = translate("common.default")
  if (autoRestTimerEnabled === false) {
    autoRestTimeSettingSummary = translate("common.no")
  } else if (restTime !== undefined && restTime !== null) {
    autoRestTimeSettingSummary = formatSecondsAsTime(restTime)
  }

  let weightUnitSettingSummary = translate("common.default")
  if (weightUnit === WeightUnit.kg) {
    weightUnitSettingSummary = translate("common.kg")
  } else if (weightUnit === WeightUnit.lbs) {
    weightUnitSettingSummary = translate("common.lbs")
  }

  const $container: ViewStyle = {
    ...themeStore.styles("listItemContainer"),
  }

  const $settingItem: ViewStyle = {
    gap: spacing.tiny,
    alignItems: "center",
  }

  const $settingsValuesContainer: ViewStyle = {
    justifyContent: "space-between",
    alignItems: "center",
  }

  return (
    <View style={$container}>
      <MenuListItem
        key={exercise.exerciseId}
        itemNameLabel={exercise.exerciseName}
        currentValue={undefined}
        onPress={() => {
          console.debug("TODO: Update exercise settings")
        }}
      />
      <RowView style={$settingsValuesContainer}>
        <RowView style={$settingItem}>
          <Text weight="bold" size="sm" tx={"manageExerciseSettingsScreen.autoRestTimeLabel"} />
          <Text preset="light" size="sm" text={autoRestTimeSettingSummary} />
        </RowView>
        <RowView style={$settingItem}>
          <Text weight="bold" size="sm" tx={"manageExerciseSettingsScreen.weightUnitLabel"} />
          <Text preset="light" size="sm" text={weightUnitSettingSummary} />
        </RowView>
      </RowView>
    </View>
  )
}

export const ManageExerciseSettingsScreen = observer(() => {
  const { exerciseStore } = useStores()

  const exercisesWithSettings = exerciseStore.allExercisesArray.filter(
    (exercise) => exercise.exerciseSettings,
  )
  // const exercisesWithoutSettings = exerciseStore.allExercisesArray.filter(
  //   (exercise) => !exercise.exerciseSettings,
  // )

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.tabScreenContainer}>
      <RowView style={[styles.alignCenter, styles.justifyBetween]}>
        <Text tx="manageExerciseSettingsScreen.manageExerciseSettingsTitle" preset="subheading" />
        {/* <Button
          tx="manageExerciseSettingsScreen.addExerciseSettingsLabel"
          preset="text"
          onPress={() => {}}
        /> */}
      </RowView>
      <FlatList
        data={exercisesWithSettings}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => <ExerciseSettingsTile {...item} />}
      />
    </Screen>
  )
})
