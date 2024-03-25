import { useFocusEffect } from "@react-navigation/native"
import { Gym } from "app/data/types"
import { useToast } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { getUserLocation } from "app/utils/getUserLocation"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useState } from "react"
import { AppState, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
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
    const [showEmptyWorkoutModal, setShowEmptyWorkoutModal] = useState(false)
    const [showRemoveIncompleteSetsModal, setShowRemoveIncompleteSetsModal] = useState(false)
    const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
    const [timeElapsed, setTimeElapsed] = useState("00:00:00")
    const [timeSinceLastSet, setTimeSinceLastSet] = useState("00:00")
    const mainNavigation = useMainNavigation()
    const [toastShowTx] = useToast()

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
              console.error("ActiveWorkoutScreen.useEffect getClosestGym error:", e)
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
      if (!workoutStore.performedAtGymId && workoutStore.timeElapsed < 3) {
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

    function hideAllModals() {
      setShowEmptyWorkoutModal(false)
      setShowRemoveIncompleteSetsModal(false)
    }

    function finishWorkout() {
      if (workoutStore.isEmptyWorkout) {
        setShowEmptyWorkoutModal(true)
        return
      }

      workoutStore.pauseWorkout()
      if (!workoutStore.isAllSetsCompleted) {
        setShowRemoveIncompleteSetsModal(true)
      } else {
        workoutStore.endWorkout()
        mainNavigation.navigate("SaveWorkout")
      }
    }

    function onConfirmRemoveIncompleteSets() {
      workoutStore.endWorkout()
      hideAllModals()
      mainNavigation.navigate("SaveWorkout")
    }

    function discardWorkout() {
      workoutStore.endWorkout()
      hideAllModals()
      mainNavigation.navigate("HomeTabNavigator")
    }

    function cancelFinishWorkout() {
      workoutStore.resumeWorkout()
      hideAllModals()
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
          <View style={styles.flex1}>
            <Button
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
          {workoutStore.performedAtGymId && (
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
          <ExerciseEntry key={`${exercise.exerciseId}_${exercise.exerciseOrder}`} {...exercise} />
        ))}

        <Button preset="text" tx="activeWorkoutScreen.addExerciseAction" onPress={addExercise} />
      </Screen>
    )
  },
)
