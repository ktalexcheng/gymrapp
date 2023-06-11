import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { observer } from "mobx-react-lite"
import moment from "moment"
import React, { FC, useEffect, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon, RowView, Screen, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing } from "../../theme"
import { ExerciseEntry } from "./ExerciseEntry"
import { formatDuration } from "./formatDuration"
import { useTimeElapsed } from "./useTimeElapsed"

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

  const progressBarWidth = 90

  const $timeProgressContainer: ViewStyle = {
    width: progressBarWidth,
    borderWidth: 1,
    borderColor: colors.actionable,
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
  }

  return (
    <>
      {workoutStore.restTimeRemaining > 0 ? (
        <RowView style={$timeProgressContainer}>
          <View style={$timeProgressRemainingContainer} />
          <RowView style={$restTimeDisplayView}>
            <Icon name="stopwatch-outline" color="black" size={30} />
            <Text numberOfLines={1}>
              {formatDuration(moment.duration(workoutStore.restTimeRemaining, "s"), false)}
            </Text>
          </RowView>
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
    const timeElapsed = useTimeElapsed()
    const rootNavigation = useMainNavigation()

    function finishWorkout() {
      workoutStore.setProp("workoutTitle", workoutTitle)
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
      padding: spacing.screen,
    }

    const $workoutHeaderRow: ViewStyle = {
      justifyContent: "space-between",
    }

    const $finishWorkoutButton: TextStyle = {
      color: colors.actionable,
    }

    const $metricsRow: ViewStyle = {
      justifyContent: "space-between",
      marginTop: spacing.medium,
    }

    const $metric: ViewStyle = {
      borderWidth: 1,
      flex: 1,
      padding: spacing.small,
      margin: spacing.extraSmall,
    }

    const $addExercise: ViewStyle = {
      justifyContent: "space-around",
      marginTop: spacing.medium,
    }

    const $workoutTitleContainer: ViewStyle = {
      width: 200,
      borderWidth: 0,
    }

    const $workoutTitle: TextStyle = {
      fontWeight: "bold",
      textAlign: "center",
    }

    return (
      <Screen safeAreaEdges={["top", "bottom"]} style={$container} preset="scroll">
        {/* Save workout confirmation dialog */}
        <SaveWorkoutDialog
          visible={showSaveDialog}
          isAllSetsCompleted={workoutStore.isAllSetsCompleted}
          onSave={saveWorkout}
          onDiscard={discardWorkout}
          onCancel={cancelEndWorkout}
        />

        <RowView style={$workoutHeaderRow}>
          <RowView>
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
            style={$workoutTitle}
            inputWrapperStyle={$workoutTitleContainer}
            // inputWrapperStyle={}
            value={workoutTitle}
            placeholderTx="activeWorkoutScreen.newActiveWorkoutTitle"
            onChangeText={setWorkoutTitle}
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
          <Text style={$metric} text={timeElapsed} />
          <Text text="Metric 2" style={$metric} />
          <Text text="Metric 3" style={$metric} />
        </RowView>

        {workoutStore.exercises.map((exercise) => (
          <ExerciseEntry key={exercise.exerciseOrder} {...exercise} />
        ))}

        <TouchableOpacity onPress={addExercise}>
          <RowView style={$addExercise}>
            <Text tx="activeWorkoutScreen.addExerciseAction" />
          </RowView>
        </TouchableOpacity>
      </Screen>
    )
  },
)
