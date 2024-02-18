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
import Toast from "react-native-root-toast"
import { ExerciseSummary } from "../FinishedWorkout"

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

export const SaveWorkoutScreen: FC = observer(() => {
  const mainNavigation = useMainNavigation()
  const { workoutStore, exerciseStore, feedStore, userStore } = useStores()
  const [showEditTitleModal, setShowEditTitleModal] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
  const [isHidden, setIsHidden] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function discardWorkout() {
    workoutStore.endWorkout()
    mainNavigation.navigate("HomeTabNavigator")
  }

  async function saveWorkout() {
    if (!userStore.user) {
      // This is highly unlikely to happen, but just in case
      Toast.show(translate("common.error.unknownErrorMessage"))
      return
    }

    setIsSaving(true)
    try {
      const workout = await workoutStore.saveWorkout(isHidden, userStore.user)
      console.debug("SaveWorkoutScreen workout", { workout })

      if (!workout) throw new Error("SaveWorkoutScreen.saveWorkout: workout is undefined")

      feedStore.addUserWorkout(workout) // Manually add the workout so it is available in WorkoutSummary
      workoutStore.resetWorkout()
      await exerciseStore.uploadExerciseSettings()
      setIsSaving(false)

      mainNavigation.reset({
        index: 1,
        routes: [
          { name: "HomeTabNavigator" },
          {
            name: "WorkoutSummary",
            params: {
              workoutId: workout.workoutId,
              workoutByUserId: workout.byUserId,
              workoutSource: WorkoutSource.User,
              jumpToComments: false,
            },
          },
        ],
      })
    } catch (e) {
      setIsSaving(false)
      console.error("SaveWorkoutScreen.saveWorkout error:", e)
      Toast.show(translate("common.error.unknownErrorMessage"))
    }
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
    <Screen
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$container}
      preset="auto"
      isBusy={isSaving}
    >
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
