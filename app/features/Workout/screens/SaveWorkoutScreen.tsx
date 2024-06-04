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
import { ExerciseSummary } from "app/features/WorkoutSummary"
import { useInternetStatus, useToast } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { logError } from "app/utils/logger"
import { toJS } from "mobx"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { Alert, TouchableOpacity, ViewStyle } from "react-native"

export const SaveWorkoutScreen: FC = observer(() => {
  const mainNavigation = useMainNavigation()
  const { activeWorkoutStore, exerciseStore, feedStore, userStore, themeStore } = useStores()
  const [showEditTitleModal, setShowEditTitleModal] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState(activeWorkoutStore.workoutTitle)
  const [isHidden, setIsHidden] = useState<"" | "true">("")
  const [isSaving, setIsSaving] = useState(false)
  const [toastShowTx] = useToast()
  const [isInternetConnected] = useInternetStatus()

  // The values "" and "true" are a hacky way to represent boolean values in the Picker component
  // because the Picker component will convert all values to strings
  const workoutIsHiddenOptions = [
    {
      label: translate("workoutSettings.workoutVisibleToFeedLabel"),
      value: "",
    },
    {
      label: translate("workoutSettings.workoutHiddenLabel"),
      value: "true",
    },
  ]

  function resumeWorkout() {
    activeWorkoutStore.resumeWorkout()
    mainNavigation.goBack()
  }

  function discardWorkout() {
    Alert.alert(
      translate("saveWorkoutScreen.discardWorkoutAlertTitle"),
      translate("saveWorkoutScreen.discardWorkoutAlertMessage"),
      [
        {
          text: translate("common.cancel"),
          style: "cancel",
        },
        {
          text: translate("common.discard"),
          style: "destructive",
          onPress: () => {
            activeWorkoutStore.endWorkout()
            mainNavigation.navigate("HomeTabNavigator")
          },
        },
      ],
    )
  }

  async function saveWorkout() {
    if (!userStore.user) {
      // This is highly unlikely to happen, but just in case
      toastShowTx("common.error.unknownErrorMessage")
      return
    }

    setIsSaving(true)
    try {
      const workout = await activeWorkoutStore.saveWorkout(
        Boolean(isHidden),
        toJS(userStore.user), // WARNING: MST map keys are stored internally as strings which toJS() returns, keep this in mind when accessing personalRecords
        !isInternetConnected,
      )

      if (!workout) throw new Error("SaveWorkoutScreen.saveWorkout: workout is undefined")

      feedStore.addWorkoutToStore(WorkoutSource.User, workout) // Manually add the workout so it is available in WorkoutSummary
      activeWorkoutStore.resetWorkout()
      await exerciseStore.uploadExerciseSettings(!isInternetConnected)
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
      logError(e, "SaveWorkoutScreen.saveWorkout error")
      toastShowTx("common.error.unknownErrorMessage")
    }
  }

  const handleShowEditTitleModal = () => {
    setWorkoutTitle(activeWorkoutStore.workoutTitle)
    setShowEditTitleModal(true)
  }

  const updateWorkoutTitle = () => {
    console.debug("SaveWorkoutScreen.updateWorkoutTitle", { workoutTitle })
    if (!workoutTitle) {
      activeWorkoutStore.setProp(
        "workoutTitle",
        translate("saveWorkoutScreen.workoutTitlePlaceholder"),
      )
    } else {
      activeWorkoutStore.setProp("workoutTitle", workoutTitle)
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
        <Button
          preset="text"
          onPress={resumeWorkout}
          tx="saveWorkoutScreen.resumeWorkoutButtonLabel"
          style={$resumeButtonContianer}
          LeftAccessory={() => (
            <Icon name="chevron-back" size={30} color={themeStore.colors("actionable")} />
          )}
        />
        <Button preset="text" onPress={saveWorkout} tx="common.save" />
      </RowView>
      <TouchableOpacity onPress={handleShowEditTitleModal}>
        <RowView alignItems="baseline">
          <Text preset="heading">
            {activeWorkoutStore.workoutTitle}
            {<Icon name="pencil-outline" size={20} />}
          </Text>
        </RowView>
      </TouchableOpacity>
      <Spacer type="vertical" size="medium" />
      <Picker
        androidPickerMode="dropdown"
        labelTx="workoutSettings.setWorkoutVisibilityLabel"
        itemsList={workoutIsHiddenOptions}
        selectedValue={isHidden}
        onValueChange={(value) => {
          console.debug("SaveWorkoutScreen.onValueChange", { value, boolean: Boolean(value) })
          setIsHidden(value)
        }}
      />
      <Text preset="subheading" tx="workoutSettings.workoutSummaryLabel" />
      {activeWorkoutStore.exercises.map((e, _) => {
        return <ExerciseSummary key={e.exerciseId} byUserId={userStore.userId!} exercise={e} />
      })}
      <Spacer type="vertical" size="medium" />
      <Button preset="dangerOutline" onPress={discardWorkout} tx="common.discard" />
    </Screen>
  )
})

const $container: ViewStyle = {
  padding: spacing.screenPadding,
}

const $saveButtonContainer: ViewStyle = {
  justifyContent: "space-between",
}

const $resumeButtonContianer: ViewStyle = {
  padding: 0,
}
