import { useFocusEffect } from "@react-navigation/native"
import { Gym } from "app/data/types"
import { useUserLocation } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useState } from "react"
import { AppState, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Button, Icon, Modal, RowView, Screen, Spacer, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { fontSize, spacing, styles } from "../../theme"
import { ExerciseEntry } from "./ExerciseEntry"

type SaveWorkoutDialogProps = {
  visible: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

const SaveWorkoutDialog: FC<SaveWorkoutDialogProps> = observer(function SaveWorkoutDialog(
  props: SaveWorkoutDialogProps,
) {
  const { visible, onSave, onDiscard, onCancel } = props
  const { workoutStore } = useStores()
  const [allSetsCompleted, setAllSetsCompleted] = useState(workoutStore.isAllSetsCompleted)

  useEffect(() => {
    setAllSetsCompleted(workoutStore.isAllSetsCompleted)
  }, [workoutStore.isAllSetsCompleted])

  const renderModalContent = () => {
    if (allSetsCompleted) {
      return (
        <>
          <Text tx="activeWorkoutScreen.dialogSaveWorkout" />
          <Spacer type="vertical" size="medium" />
          <Button preset="text" tx="activeWorkoutScreen.saveWorkout" onPress={onSave} />
          <Button preset="text" tx="activeWorkoutScreen.discardWorkout" onPress={onDiscard} />
          <Button preset="text" tx="activeWorkoutScreen.cancelAction" onPress={onCancel} />
        </>
      )
    } else {
      return (
        <>
          <Text tx="activeWorkoutScreen.dialogRemoveIncompletedSets" />
          <Spacer type="vertical" size="medium" />
          <Button
            preset="text"
            tx="activeWorkoutScreen.confirmRemoveIncompletedSets"
            onPress={() => setAllSetsCompleted(true)}
          />
          <Button
            preset="text"
            tx="activeWorkoutScreen.rejectRemoveIncompletedSets"
            onPress={onCancel}
          />
        </>
      )
    }
  }

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
      {renderModalContent()}
    </Modal>
  )
})

const RestTimerProgressBar: FC = observer(() => {
  const { workoutStore, themeStore } = useStores()
  const mainNavigation = useMainNavigation()

  const progressBarWidth = 75

  const $timeProgressContainer: ViewStyle = {
    width: progressBarWidth,
    height: "80%",
    borderRadius: 10,
    backgroundColor: themeStore.colors("contentBackground"),
    overflow: "hidden",
    alignItems: "center",
  }

  const $timeProgressRemainingContainer: ViewStyle = {
    position: "absolute",
    height: "100%",
    width: `${Math.floor((workoutStore.restTimeRemaining / workoutStore.restTime) * 100)}%`,
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
      {workoutStore.restTimeRunning ? (
        <RowView style={$timeProgressContainer}>
          <View style={$timeProgressRemainingContainer} />
          <View style={$restTimeDisplayView}>
            <Text numberOfLines={1} text={formatSecondsAsTime(workoutStore.restTimeRemaining)} />
          </View>
        </RowView>
      ) : (
        <Icon name="stopwatch-outline" color={themeStore.colors("foreground")} size={30} />
      )}
    </TouchableOpacity>
  )
})

interface ActiveWorkoutScreenProps extends MainStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen({ navigation }) {
    const { userStore, workoutStore, gymStore, themeStore } = useStores()
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
    const [timeElapsed, setTimeElapsed] = useState("00:00:00")
    const [timeSinceLastSet, setTimeSinceLastSet] = useState("00:00")
    const mainNavigation = useMainNavigation()
    const { userLocation, isLocationPermissionGranted, isGettingUserLocation } = useUserLocation()
    const [gym, setGym] = useState<Gym>()

    useEffect(() => {
      console.debug("ActiveWorkoutScreen.useEffect getClosestGym called")
      if (isLocationPermissionGranted && !isGettingUserLocation) {
        const userMyGyms = userStore.getProp<Gym[]>("user.myGyms")
        if (userMyGyms && userMyGyms.length > 0 && userLocation) {
          gymStore
            .getClosestGym(
              userLocation,
              userMyGyms.map((gym) => gym.gymId),
            )
            .then((closestGym) => {
              if (closestGym.gym) {
                setGym(closestGym.gym)
                workoutStore.setGym(closestGym.gym)
              }
            })
            .catch((e) => {
              console.error("ActiveWorkoutScreen.useEffect getClosestGym error:", e)
            })
        }
      }
    }, [isLocationPermissionGranted, isGettingUserLocation])

    useEffect(() => {
      if (workoutStore.performedAtGymId && workoutStore.performedAtGymName) {
        setGym({ gymId: workoutStore.performedAtGymId, gymName: workoutStore.performedAtGymName })
      }
    }, [workoutStore.performedAtGymId, workoutStore.performedAtGymName])

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
      }
    }, [workoutStore.inProgress])

    // Dismiss stale rest timer notification when app is resumed from background
    useEffect(() => {
      const subscribeAppStateChange = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          if (!workoutStore.restTimeRunning) {
            console.debug(
              "ActiveWorkoutScreen AppState.addEventListener: dismiss exercise rest notifications",
            )
            workoutStore.dismissRestNotifications()
          }
        }
      })

      return () => subscribeAppStateChange.remove()
    }, [])

    // Dismiss stale rest timer notification when user navigates back to this screen
    // Set a 3 second delay to allow the notification to be displayed briefly
    useFocusEffect(
      useCallback(() => {
        if (!workoutStore.restTimeRunning) {
          console.debug("ActiveWorkoutScreen useFocusEffect: dismiss exercise rest notifications")
          const timeout = setTimeout(() => workoutStore.dismissRestNotifications(), 3000)
          return () => clearTimeout(timeout)
        }
        return undefined
      }, [workoutStore.restTimeRunning]),
    )

    function updateWorkoutTitle(value: string) {
      setWorkoutTitle(value)
      workoutStore.setProp("workoutTitle", value)
    }

    function finishWorkout() {
      workoutStore.pauseWorkout()
      setShowSaveDialog(true)
    }

    async function saveWorkout() {
      setShowSaveDialog(false)
      workoutStore.endWorkout()
      mainNavigation.navigate("SaveWorkout")
    }

    function discardWorkout() {
      workoutStore.endWorkout()
      setShowSaveDialog(false)
      mainNavigation.navigate("HomeTabNavigator")
    }

    function cancelEndWorkout() {
      workoutStore.resumeWorkout()
      setShowSaveDialog(false)
    }

    function addExercise() {
      navigation.navigate("ExercisePicker")
    }

    const $container: ViewStyle = {
      padding: spacing.screenPadding,
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
      justifyContent: "space-between",
      alignItems: "center",
      height: 50,
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
      <Screen safeAreaEdges={["top", "bottom"]} preset="scroll" contentContainerStyle={$container}>
        {/* Save workout confirmation dialog */}
        <SaveWorkoutDialog
          visible={showSaveDialog}
          onSave={saveWorkout}
          onDiscard={discardWorkout}
          onCancel={cancelEndWorkout}
        />

        <RowView style={$workoutHeaderRow}>
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
            tx="activeWorkoutScreen.finishWorkoutButton"
            preset="text"
            onPress={finishWorkout}
          />
        </RowView>

        <RowView style={styles.alignCenter}>
          <Icon name="location-sharp" color={themeStore.colors("foreground")} size={30} />
          <View style={styles.flex1}>
            <Button
              preset="text"
              numberOfLines={1}
              onPress={() => mainNavigation.navigate("WorkoutGymPicker")}
              text={gym ? gym.gymName : translate("activeWorkoutScreen.setCurrentGymLabel")}
              style={$gymTextButton}
            />
          </View>
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
          <ExerciseEntry key={`${exercise.exerciseId}_${exercise.exerciseOrder}`} {...exercise} />
        ))}

        <Button preset="text" tx="activeWorkoutScreen.addExerciseAction" onPress={addExercise} />
      </Screen>
    )
  },
)
