import Ionicons from "@expo/vector-icons/Ionicons"
import { ActivityStackScreenProps } from "app/navigators/ActivityNavigator"
import { observer } from "mobx-react-lite"
import moment from "moment"
import { Icon } from "native-base"
import React, { FC, useEffect, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { RowView, Screen, Text } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing } from "../../theme"
import { ExerciseEntry } from "./ExerciseEntry"
import { formatDuration } from "./formatDuration"

type SaveWorkoutDialogProps = {
  visible: boolean
  onSave: () => void
  onCancel: () => void
}

const SaveWorkoutDialog: FC<SaveWorkoutDialogProps> = function SaveWorkoutDialog(
  props: SaveWorkoutDialogProps,
) {
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
        <View style={$saveDialog}>
          <Text>Confirm save?</Text>
          <TouchableOpacity onPress={props.onSave}>
            <Text>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onCancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    borderColor: colors.actionBackground,
  }

  const $timeProgressRemainingContainer: ViewStyle = {
    width: Math.floor((workoutStore.restTimeRemaining / workoutStore.restTime) * 100) + "%",
    backgroundColor: colors.actionBackground,
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
            <Icon as={Ionicons} name="stopwatch-outline" color="black" size={30} />
            <Text numberOfLines={1}>
              {formatDuration(moment.duration(workoutStore.restTimeRemaining, "s"), false)}
            </Text>
          </RowView>
        </RowView>
      ) : (
        <Icon as={Ionicons} name="stopwatch-outline" color="black" size={30} />
      )}
    </>
  )
})

interface ActiveWorkoutScreenProps extends ActivityStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen({ navigation }) {
    const { workoutStore, exerciseStore } = useStores()
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [timeElapsed, setTimeElapsed] = useState("00:00:00")

    useEffect(() => {
      const updateTimeElapsed = () => {
        // Update timer
        const start = moment(workoutStore.startTime)
        const duration = moment.duration(moment().diff(start))
        const formatted = formatDuration(duration)

        setTimeElapsed(formatted)

        // Check if rest time is active and update that as well
        if (workoutStore.restTimeRemaining > 0) {
          workoutStore.subtractRestTimeRemaining(1)
        }
      }

      const intervalId = setInterval(updateTimeElapsed, 1000)

      // Function called when component unmounts
      return () => {
        clearInterval(intervalId)
      }
    }, [])

    function finishWorkout() {
      workoutStore.pauseWorkout()
      setShowSaveDialog(true)
    }

    function saveWorkout() {
      workoutStore.endWorkout()
      exerciseStore.uploadExerciseSettings()
      setShowSaveDialog(false)
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
      color: colors.actionBackground,
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

    return (
      <Screen safeAreaEdges={["top", "bottom"]} style={$container} preset="scroll">
        {/* Save workout confirmation dialog */}
        <SaveWorkoutDialog
          visible={showSaveDialog}
          onSave={saveWorkout}
          onCancel={cancelEndWorkout}
        />

        <RowView style={$workoutHeaderRow}>
          <RowView>
            <Ionicons name="chevron-down-outline" color="black" size={30} />
            <RestTimerProgressBar />
          </RowView>
          <Text tx="activeWorkoutScreen.newActiveWorkoutTitle" preset="bold" />
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

        {/* TODO: Create reuseable component for exercise */}
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
