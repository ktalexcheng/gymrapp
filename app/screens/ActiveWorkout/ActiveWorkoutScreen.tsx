import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon, RowView, Screen, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, fontSize, spacing } from "../../theme"
import { ExerciseEntry } from "./ExerciseEntry"

type SaveWorkoutDialogProps = {
  visible: boolean
  isAllSetsCompleted: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

const SaveWorkoutDialog: FC<SaveWorkoutDialogProps> = function SaveWorkoutDialog(
  props: SaveWorkoutDialogProps,
) {
  const [allSetsCompleted, setAlSetsCompleted] = useState(props.isAllSetsCompleted)

  useEffect(() => {
    setAlSetsCompleted(props.isAllSetsCompleted)
  }, [props.visible, props.isAllSetsCompleted])

  const $saveDialogContainer: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }

  const $saveDialog: ViewStyle = {
    flexBasis: "auto",
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.visible}
      onRequestClose={props.onCancel}
    >
      <View style={$saveDialogContainer}>
        {allSetsCompleted ? (
          <View style={$saveDialog}>
            <Text tx="activeWorkoutScreen.dialogSaveWorkout" />
            <TouchableOpacity onPress={props.onSave}>
              <Text tx="activeWorkoutScreen.saveWorkout" />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onDiscard}>
              <Text tx="activeWorkoutScreen.discardWorkout" />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onCancel}>
              <Text tx="activeWorkoutScreen.cancelAction" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={$saveDialog}>
            <Text tx="activeWorkoutScreen.dialogRemoveIncompletedSets" />
            <TouchableOpacity onPress={() => setAlSetsCompleted(true)}>
              <Text tx="activeWorkoutScreen.confirmRemoveIncompletedSets" />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onCancel}>
              <Text tx="activeWorkoutScreen.rejectRemoveIncompletedSets" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  )
}

const RestTimerProgressBar: FC = observer(() => {
  const { workoutStore } = useStores()

  const progressBarWidth = 75

  const $timeProgressContainer: ViewStyle = {
    width: progressBarWidth,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: colors.actionable,
    overflow: "hidden",
  }

  const $timeProgressRemainingContainer: ViewStyle = {
    width: Math.floor((workoutStore.restTimeRemaining / workoutStore.restTime) * 100) + "%",
    backgroundColor: colors.actionable,
  }

  const $restTimeDisplayView: ViewStyle | TextStyle = {
    position: "absolute",
    height: "100%",
    width: "100%",
    alignItems: "center",
    textAlign: "center",
  }

  return (
    <>
      {workoutStore.restTimeRemaining > 0 ? (
        <RowView style={$timeProgressContainer}>
          <View style={$timeProgressRemainingContainer} />
          <Text style={$restTimeDisplayView} numberOfLines={1}>
            {formatSecondsAsTime(workoutStore.restTimeRemaining)}
          </Text>
        </RowView>
      ) : (
        <Icon name="stopwatch-outline" color="black" size={30} />
      )}
    </>
  )
})

interface ActiveWorkoutScreenProps extends MainStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen({ navigation }) {
    const { workoutStore, exerciseStore } = useStores()
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [workoutTitle, setWorkoutTitle] = useState(workoutStore.workoutTitle)
    const [timeElapsed, setTimeElapsed] = useState("00:00:00")
    const [timeSinceLastSet, setTimeSinceLastSet] = useState("00:00")
    const rootNavigation = useMainNavigation()

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

    function updateWorkoutTitle(value: string) {
      setWorkoutTitle(value)
      workoutStore.setProp("workoutTitle", value)
    }

    function finishWorkout() {
      workoutStore.pauseWorkout()
      setShowSaveDialog(true)
    }

    function saveWorkout() {
      workoutStore.endWorkout()
      workoutStore.saveWorkout()
      exerciseStore.uploadExerciseSettings()
      setShowSaveDialog(false)

      // TODO: Navigate to workout summary
      rootNavigation.navigate("HomeTabNavigator")
    }

    function discardWorkout() {
      workoutStore.endWorkout()
      setShowSaveDialog(false)
      rootNavigation.navigate("HomeTabNavigator")
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
      marginTop: spacing.medium,
    }

    const $metricLabel: TextStyle = {
      fontSize: fontSize.tiny,
    }

    const $metric: ViewStyle = {
      borderWidth: 1,
      borderRadius: 5,
      borderColor: colors.separator,
      flex: 1,
      padding: spacing.small,
      margin: spacing.extraSmall,
    }

    const $addExercise: ViewStyle = {
      justifyContent: "space-around",
      marginTop: spacing.medium,
    }

    const $workoutHeaderRow: ViewStyle = {
      justifyContent: "space-between",
      alignItems: "center",
    }

    const $minimizeAndTimer: ViewStyle = {
      flex: 2,
    }

    const $workoutTitleContainer: ViewStyle = {
      flex: 3,
    }

    const $workoutTitleWrapper: TextStyle = {
      borderWidth: 0,
    }

    const $workoutTitle: TextStyle = {
      fontWeight: "bold",
      textAlign: "center",
    }

    const $finishWorkoutButton: ViewStyle & TextStyle = {
      flex: 2,
      textAlign: "right",
      color: colors.actionable,
    }

    return (
      <Screen safeAreaEdges={["top", "bottom"]} preset="scroll">
        {/* Save workout confirmation dialog */}
        <SaveWorkoutDialog
          visible={showSaveDialog}
          isAllSetsCompleted={workoutStore.isAllSetsCompleted}
          onSave={saveWorkout}
          onDiscard={discardWorkout}
          onCancel={cancelEndWorkout}
        />

        <View style={$container}>
          <RowView style={$workoutHeaderRow}>
            <RowView style={$minimizeAndTimer}>
              <Icon
                name="chevron-down-outline"
                color="black"
                size={30}
                onPress={() => rootNavigation.navigate("HomeTabNavigator")}
              />
              <RestTimerProgressBar />
            </RowView>

            <TextField
              selectTextOnFocus
              containerStyle={$workoutTitleContainer}
              inputWrapperStyle={$workoutTitleWrapper}
              style={$workoutTitle}
              value={workoutTitle}
              placeholderTx="activeWorkoutScreen.newActiveWorkoutTitle"
              onChangeText={updateWorkoutTitle}
              autoCapitalize="sentences"
            />

            {/* TODO: Active workout title should be dependent on the template used */}
            <Text
              tx="activeWorkoutScreen.finishWorkoutButton"
              style={$finishWorkoutButton}
              onPress={finishWorkout}
            />
          </RowView>

          {/* TODO: Dynamically update metrics as workout progresses */}
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

          {workoutStore.exercises.map((exercise, i) => (
            <ExerciseEntry key={i} {...exercise} />
          ))}

          <TouchableOpacity onPress={addExercise}>
            <RowView style={$addExercise}>
              <Text tx="activeWorkoutScreen.addExerciseAction" />
            </RowView>
          </TouchableOpacity>
        </View>
      </Screen>
    )
  },
)
