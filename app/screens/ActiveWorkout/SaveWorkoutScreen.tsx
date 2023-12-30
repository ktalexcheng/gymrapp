import {
  Button,
  Icon,
  Modal,
  Picker,
  RowView,
  Screen,
  Spacer,
  Text,
  TextField,
} from "app/components"
import { WorkoutSource } from "app/data/constants"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { TouchableOpacity, ViewStyle } from "react-native"
import { ExerciseSummary } from "../FinishedWorkout"

export const SaveWorkoutScreen: FC = observer(() => {
  const mainNavigation = useMainNavigation()
  const { workoutStore, exerciseStore, feedStore } = useStores()
  const [showEditTitleModal, setShowEditTitleModal] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
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

  function discardWorkout() {
    workoutStore.endWorkout()
    mainNavigation.navigate("HomeTabNavigator")
  }

  async function saveWorkout() {
    const workout = await workoutStore.saveWorkout(isHidden)
    await exerciseStore.uploadExerciseSettings()
    feedStore.loadUserWorkouts() // Do this asynchronously

    mainNavigation.reset({
      index: 1,
      routes: [
        { name: "HomeTabNavigator" },
        {
          name: "WorkoutSummary",
          params: {
            workoutId: workout.workoutId,
            workout,
            workoutSource: WorkoutSource.User,
            jumpToComments: false,
          },
        },
      ],
    })
  }

  const handleShowEditTitleModal = () => {
    setWorkoutTitle(workoutStore.workoutTitle)
    setShowEditTitleModal(true)
  }

  const updateWorkoutTitle = () => {
    console.debug("SaveWorkoutScreen.updateWorkoutTitle", { workoutTitle })
    if (!workoutTitle) {
      workoutStore.setProp("workoutTitle", translate("saveWorkoutScreen.workoutTitlePlaceholder"))
    } else {
      workoutStore.setProp("workoutTitle", workoutTitle)
    }
    setShowEditTitleModal(false)
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container} preset="auto">
      <Modal
        animationType="slide"
        onRequestClose={() => setShowEditTitleModal(false)}
        visible={showEditTitleModal}
        transparent={true}
      >
        <TextField
          autoFocus={true}
          labelTx="saveWorkoutScreen.workoutTitleLabel"
          onChangeText={setWorkoutTitle}
          onSubmitEditing={updateWorkoutTitle}
          placeholderTx="saveWorkoutScreen.workoutTitlePlaceholder"
          value={workoutTitle}
        />
        <Button preset="text" onPress={updateWorkoutTitle} tx="common.ok" />
      </Modal>

      <RowView style={$saveButtonContainer}>
        <Button preset="text" onPress={discardWorkout} tx="common.discard" />
        <Button preset="text" onPress={saveWorkout} tx="common.save" />
      </RowView>
      <TouchableOpacity onPress={handleShowEditTitleModal}>
        <RowView alignItems="baseline">
          <Text preset="heading">
            {workoutStore.workoutTitle}
            {<Icon name="pencil-outline" size={20} />}
          </Text>
        </RowView>
      </TouchableOpacity>
      <Spacer type="vertical" size="medium" />
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
})

const $container: ViewStyle = {
  padding: spacing.screenPadding,
}

const $saveButtonContainer: ViewStyle = {
  justifyContent: "space-between",
}
