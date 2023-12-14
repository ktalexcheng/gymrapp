import { Button, Picker, RowView, Screen, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import { ExerciseSummary } from "../FinishedWorkout"

export const SaveWorkoutScreen: FC = () => {
  const mainNavigation = useMainNavigation()
  const { workoutStore, exerciseStore, feedStore } = useStores()
  const [isHidden, setIsHidden] = useState(false)
  const workoutIsHiddenOptions = [
    {
      label: translate("workoutSettings.workoutVisibleToFeedLabel"),
      value: false,
    },
    {
      label: translate("workoutSettings.workoutHiddenLabel"),
      value: true,
    },
  ]

  async function saveWorkout() {
    const workoutId = await workoutStore.saveWorkout(isHidden)
    await exerciseStore.uploadExerciseSettings()
    feedStore.loadUserWorkouts() // Do this asynchronously

    mainNavigation.reset({
      index: 1,
      routes: [
        { name: "HomeTabNavigator" },
        {
          name: "WorkoutSummary",
          params: {
            workoutId,
            workoutSource: WorkoutSource.User,
            jumpToComments: false,
          },
        },
      ],
    })
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <RowView style={$saveButtonContainer}>
        <Button preset="text" onPress={saveWorkout} tx="common.save" />
      </RowView>
      <Text preset="heading">{workoutStore.workoutTitle}</Text>
      <Picker
        labelTx="workoutSettings.setWorkoutVisibilityLabel"
        itemsList={workoutIsHiddenOptions}
        selectedValue={isHidden}
        onValueChange={setIsHidden}
      />
      <Text preset="subheading" tx="workoutSettings.workoutSummaryLabel" />
      {workoutStore.exercises.map((e, _) => {
        return <ExerciseSummary key={e.exerciseId} exercise={e} />
      })}
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.screenPadding,
  flex: 1,
}

const $saveButtonContainer: ViewStyle = {
  justifyContent: "flex-end",
}
