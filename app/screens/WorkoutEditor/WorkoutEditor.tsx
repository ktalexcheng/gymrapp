import { Gym } from "app/data/types"
import { useInternetStatus, useToast } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { getUserLocation } from "app/utils/getUserLocation"
import { logError } from "app/utils/logger"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { Alert, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Button, Icon, Modal, RowView, Screen, Spacer, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { fontSize, spacing, styles } from "../../theme"
import { ExerciseEntry } from "./ExerciseEntry"

type RemoveIncompleteSetsModalProps = {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

const RemoveIncompleteSetsModal: FC<RemoveIncompleteSetsModalProps> = observer(
  function RemoveIncompleteSetsModal(props: RemoveIncompleteSetsModalProps) {
    const { visible, onConfirm, onCancel } = props

    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
        <Text tx="activeWorkoutScreen.dialogRemoveIncompletedSets" />
        <Spacer type="vertical" size="medium" />
        <Button
          preset="text"
          tx="activeWorkoutScreen.confirmRemoveIncompletedSets"
          onPress={onConfirm}
        />
        <Button
          preset="text"
          tx="activeWorkoutScreen.rejectRemoveIncompletedSets"
          onPress={onCancel}
        />
      </Modal>
    )
  },
)

type EmptyWorkoutModalProps = {
  visible: boolean
  onDiscard: () => void
  onCancel: () => void
}

const EmptyWorkoutModal: FC<EmptyWorkoutModalProps> = observer(function EmptyWorkoutModal(
  props: EmptyWorkoutModalProps,
) {
  const { visible, onDiscard, onCancel } = props

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
      <Text tx="activeWorkoutScreen.noExercisesAddedMessage" />
      <Spacer type="vertical" size="medium" />
      <Button preset="text" tx="common.ok" onPress={onCancel} />
      <Button preset="dangerText" tx="activeWorkoutScreen.discardWorkout" onPress={onDiscard} />
    </Modal>
  )
})

const RestTimerProgressBar: FC = observer(() => {
  const { activeWorkoutStore, themeStore } = useStores()
  const mainNavigation = useMainNavigation()

  const progressBarWidth = 75

  const $timeProgressContainer: ViewStyle = {
    width: progressBarWidth,
    height: 40,
    borderRadius: 10,
    backgroundColor: themeStore.colors("contentBackground"),
    overflow: "hidden",
    alignItems: "center",
  }

  const $timeProgressRemainingContainer: ViewStyle = {
    position: "absolute",
    height: "100%",
    width: `${Math.floor(
      (activeWorkoutStore.restTimeRemaining / activeWorkoutStore.restTime) * 100,
    )}%`,
    backgroundColor: themeStore.colors("lightTint"),
  }

  const $restTimeDisplayView: ViewStyle | TextStyle = {
    flex: 1,
    width: progressBarWidth,
    justifyContent: "center",
    alignItems: "center",
  }

  return (
    <TouchableOpacity onPress={() => mainNavigation.navigate("RestTimer")}>
      {activeWorkoutStore.restTimeRunning ? (
        <RowView style={$timeProgressContainer}>
          <View style={$timeProgressRemainingContainer} />
          <View style={$restTimeDisplayView}>
            <Text
              numberOfLines={1}
              text={formatSecondsAsTime(activeWorkoutStore.restTimeRemaining)}
            />
          </View>
        </RowView>
      ) : (
        <Icon name="stopwatch-outline" color={themeStore.colors("foreground")} size={30} />
      )}
    </TouchableOpacity>
  )
})

type WorkoutEditorProps = {
  mode: "active" | "editor"
}

export const WorkoutEditor = observer((props: WorkoutEditorProps) => {
  const { mode } = props
  const { feedStore, userStore, activeWorkoutStore, workoutEditorStore, gymStore, themeStore } =
    useStores()
  const isActiveWorkout = mode === "active"
  const workoutStore = isActiveWorkout ? activeWorkoutStore : workoutEditorStore
  const [showEmptyWorkoutModal, setShowEmptyWorkoutModal] = useState(false)
  const [showRemoveIncompleteSetsModal, setShowRemoveIncompleteSetsModal] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
  const [timeElapsed, setTimeElapsed] = useState("00:00:00")
  const [timeSinceLastSet, setTimeSinceLastSet] = useState("00:00")
  const mainNavigation = useMainNavigation()
  const [toastShowTx] = useToast()
  const [isInternetConnected] = useInternetStatus()
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    const checkNearestFavoriteGym = async () => {
      const userLocation = await getUserLocation()
      if (!userLocation || !userLocation.location) {
        toastShowTx("userLocation.unableToAcquireLocationMessage")
        return
      }

      const userMyGyms = userStore.getPropAsJS<Gym[]>("user.myGyms")
      if (userMyGyms && userMyGyms.length > 0) {
        gymStore
          .getClosestGym(
            userLocation.location,
            userMyGyms.map((gym) => gym.gymId),
          )
          .then((closestGym) => {
            if (closestGym.gym) {
              toastShowTx("activeWorkoutScreen.favoriteGymFoundMessage", {
                txOptions: { gymName: closestGym.gym.gymName },
              })
              // setGym(closestGym.gym)
              workoutStore.setGym(closestGym.gym)
            } else {
              toastShowTx("activeWorkoutScreen.noFavoriteGymFoundMessage")
            }
          })
          .catch((e) => {
            logError(e, "ActiveWorkoutScreen.useEffect getClosestGym error")
          })
      } else {
        toastShowTx("activeWorkoutScreen.emptyFavoriteGymsMessage")
      }
    }

    // To prevent overriding the gym set by the user and because the screen can be unmounted and mounted multiple times,
    // we only try this within the first 3 seconds of the start of the workout
    console.debug("ActiveWorkoutScreen.useEffect called", {
      performedAtGymId: workoutStore.performedAtGymId,
      timeElapsed: workoutStore.timeElapsed,
    })
    if (!workoutStore.performedAtGymId && workoutStore.timeElapsed < 3 && isActiveWorkout) {
      console.debug("ActiveWorkoutScreen.useEffect getting closest gym")
      checkNearestFavoriteGym()
    }
  }, [])

  // @ts-ignore
  useEffect(() => {
    if (workoutStore.inProgress) {
      const intervalId = setInterval(() => {
        setTimeElapsed(workoutStore.timeElapsedFormatted)
        setTimeSinceLastSet(workoutStore.timeSinceLastSetFormatted)
      }, 1000)
      console.debug("ActiveWorkoutScreen setInterval called:", intervalId)

      return () => {
        console.debug("ActiveWorkoutScreen clearInterval called:", intervalId)
        clearInterval(intervalId)
      }
    } else {
      setTimeElapsed(workoutStore.workoutDurationFormatted)
    }
  }, [workoutStore.inProgress])

  function updateWorkoutTitle(value: string) {
    setWorkoutTitle(value)
    workoutStore.setProp("workoutTitle", value)
  }

  function hideAllModals() {
    setShowEmptyWorkoutModal(false)
    setShowRemoveIncompleteSetsModal(false)
  }

  function validateWorkout() {
    if (workoutStore.isEmptyWorkout) {
      setShowEmptyWorkoutModal(true)
      return false
    }

    if (!workoutStore.isAllSetsCompleted) {
      setShowRemoveIncompleteSetsModal(true)
      return false
    }

    return true
  }

  function finishWorkout() {
    if (!validateWorkout()) return

    if (isActiveWorkout) {
      workoutStore.pauseWorkout()
      workoutStore.endWorkout()
      mainNavigation.navigate("SaveWorkout")
    } else {
      Alert.alert(
        translate("editWorkoutScreen.editWorkoutWarningTitle"),
        translate("editWorkoutScreen.editWorkoutWarningMessage"),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("common.save"),
            onPress: () => updateWorkout(),
          },
        ],
      )
    }
  }

  async function updateWorkout() {
    if (userStore.user) {
      setIsBusy(true)
      workoutEditorStore
        .updateWorkout(workoutEditorStore.isHidden, userStore.user, !isInternetConnected)
        .then((updatedWorkout) => {
          console.debug("WorkoutEditor.updateWorkout():", { updatedWorkout })
          feedStore.addUserWorkout(updatedWorkout)
          mainNavigation.goBack()
        })
        .finally(() => setIsBusy(false))
    } else {
      toastShowTx("common.error.unknownErrorMessage")
    }
  }

  function onConfirmRemoveIncompleteSets() {
    hideAllModals()

    if (isActiveWorkout) {
      workoutStore.endWorkout()
      mainNavigation.navigate("SaveWorkout")
    } else {
      updateWorkout()
    }
  }

  function discardWorkout() {
    hideAllModals()

    if (isActiveWorkout) {
      workoutStore.endWorkout()
      mainNavigation.navigate("HomeTabNavigator")
    } else {
      workoutStore.resetWorkout()
      mainNavigation.goBack()
    }
  }

  function cancelFinishWorkout() {
    if (isActiveWorkout) workoutStore.resumeWorkout()
    hideAllModals()
  }

  function addExercise() {
    mainNavigation.navigate("ExercisePicker", { mode })
  }

  function renderHeaderRow() {
    const $containerInsets = useSafeAreaInsetsStyle(["top"])

    return (
      <View style={$containerInsets}>
        <RowView style={$workoutHeaderRow}>
          {isActiveWorkout ? (
            <RowView
              style={[
                styles.flex1,
                styles.alignCenter,
                workoutStore.restTimeRunning ? styles.flex2 : null,
              ]}
            >
              <Icon
                name="chevron-down-outline"
                color={themeStore.colors("foreground")}
                size={30}
                onPress={() => mainNavigation.navigate("HomeTabNavigator")}
              />
              <RestTimerProgressBar />
            </RowView>
          ) : (
            <Button preset="text" tx="common.discard" onPress={() => mainNavigation.goBack()} />
          )}

          <TextField
            selectTextOnFocus
            containerStyle={styles.flex4}
            inputWrapperStyle={$workoutTitleWrapper}
            style={$workoutTitle}
            value={workoutTitle}
            placeholderTx="activeWorkoutScreen.newActiveWorkoutTitle"
            onChangeText={updateWorkoutTitle}
            autoCapitalize="sentences"
          />

          <Button
            tx={isActiveWorkout ? "activeWorkoutScreen.finishWorkoutButton" : "common.save"}
            preset="text"
            onPress={finishWorkout}
          />
        </RowView>
      </View>
    )
  }

  const $container: ViewStyle = {
    // paddingTop intentionally left out because of header row
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  }

  const $metricsRow: ViewStyle = {
    justifyContent: "space-between",
  }

  const $metricLabel: TextStyle = {
    fontSize: fontSize.tiny,
  }

  const $metric: ViewStyle = {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: themeStore.colors("separator"),
    flex: 1,
    padding: spacing.small,
    margin: spacing.extraSmall,
  }

  const $workoutHeaderRow: ViewStyle = {
    paddingTop: spacing.screenPadding,
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenPadding,
    // paddingBottom intentionally left out because of Screen component below it
    justifyContent: "space-between",
    alignItems: "center",
  }

  const $workoutTitleWrapper: TextStyle = {
    borderWidth: 0,
  }

  const $workoutTitle: TextStyle = {
    fontWeight: "bold",
    textAlign: "center",
  }

  const $gymTextButton: ViewStyle = {
    justifyContent: "flex-start",
  }

  return (
    <>
      {renderHeaderRow()}

      <Screen
        safeAreaEdges={["bottom"]}
        preset="scroll"
        contentContainerStyle={$container}
        isBusy={isBusy}
      >
        <EmptyWorkoutModal
          visible={showEmptyWorkoutModal}
          onDiscard={discardWorkout}
          onCancel={cancelFinishWorkout}
        />

        <RemoveIncompleteSetsModal
          visible={showRemoveIncompleteSetsModal}
          onConfirm={onConfirmRemoveIncompleteSets}
          onCancel={cancelFinishWorkout}
        />

        <RowView style={styles.alignCenter}>
          <View style={styles.flex1}>
            <Button
              disabled={!isActiveWorkout}
              preset="text"
              numberOfLines={1}
              onPress={() => mainNavigation.navigate("WorkoutGymPicker")}
              text={
                workoutStore.performedAtGymName
                  ? workoutStore.performedAtGymName
                  : translate("activeWorkoutScreen.setCurrentGymLabel")
              }
              style={$gymTextButton}
              LeftAccessory={() => (
                <Icon name="location-sharp" color={themeStore.colors("foreground")} size={30} />
              )}
            />
          </View>
          {workoutStore.performedAtGymId && isActiveWorkout && (
            <Icon name="close-outline" onPress={() => workoutStore.setGym(undefined)} size={30} />
          )}
        </RowView>

        <RowView style={$metricsRow}>
          <View style={$metric}>
            <Text tx="activeWorkoutScreen.timeElapsedLabel" style={$metricLabel} />
            <Text text={timeElapsed} />
          </View>
          <View style={$metric}>
            <Text tx="activeWorkoutScreen.timeSinceLastSetLabel" style={$metricLabel} />
            <Text text={timeSinceLastSet} />
          </View>
          <View style={$metric}>
            <Text tx="activeWorkoutScreen.totalVolumeLabel" style={$metricLabel} />
            <Text text={workoutStore.totalVolume.toFixed(0)} />
          </View>
        </RowView>

        {workoutStore.exercises.map((exercise) => (
          <ExerciseEntry
            mode={mode}
            key={`${exercise.exerciseId}_${exercise.exerciseOrder}`}
            {...exercise}
          />
        ))}

        <Button preset="text" tx="activeWorkoutScreen.addExerciseAction" onPress={addExercise} />
      </Screen>
    </>
  )
})
