import Ionicons from "@expo/vector-icons/Ionicons"
import { ActivityStackScreenProps } from "app/navigators/ActivityNavigator"
import { observer } from "mobx-react-lite"
import moment from "moment"
import { Icon } from "native-base"
import React, { FC, useEffect, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { RowView, Screen, Text, TextField } from "../components"
import { useStores } from "../stores"
import { colors, spacing } from "../theme"

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

function formatDuration(d: moment.Duration, showHour = true): string {
  if (showHour) {
    const hours = Math.floor(d.asHours())
    const minutes = Math.floor(d.asMinutes()) - hours * 60
    const seconds = Math.floor(d.asSeconds()) - (hours * 60 + minutes) * 60

    return (
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0")
    )
  } else {
    const minutes = Math.floor(d.asMinutes())
    const seconds = Math.floor(d.asSeconds()) - minutes * 60

    return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0")
  }
}

type SetEntryProps = {
  exerciseOrder: number
  setOrder: number
  type: string
  weight: number
  reps: number
  ifCompleted: boolean
}

const SetEntry: FC = observer((props: SetEntryProps) => {
  const { workoutStore } = useStores()
  const { exerciseOrder, setOrder } = props
  const exerciseSetStore = workoutStore.exercises[exerciseOrder].sets[setOrder]

  function toggleSetStatus() {
    // setCompleted(!completed)
    exerciseSetStore.setProp("ifCompleted", !exerciseSetStore.ifCompleted)

    if (exerciseSetStore.ifCompleted) {
      workoutStore.setProp("restTime", 65)
      workoutStore.setProp("restTimeRemaining", 65)
    }
  }

  function setExerciseSetWeight(value: string) {
    if (value) {
      exerciseSetStore.setProp("weight", Number(value))
    } else {
      exerciseSetStore.setProp("weight", undefined)
    }
  }

  function setExerciseSetReps(value: string) {
    if (value) {
      exerciseSetStore.setProp("reps", Number(value))
    } else {
      exerciseSetStore.setProp("reps", undefined)
    }
  }

  const $exerciseSet: ViewStyle = {
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing.tiny,
  }

  const $textFieldContainer: ViewStyle = {
    padding: 0,
    width: 70,
  }

  return (
    <RowView style={$exerciseSet}>
      <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
      {/* TODO: Find last set record that is the same set order */}
      <Text text="N/A" style={[$previousColumn, $textAlignCenter]} />
      <View style={$weightColumn}>
        <TextField
          value={exerciseSetStore.weight !== undefined ? exerciseSetStore.weight.toString() : ""}
          onChangeText={setExerciseSetWeight}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="number-pad"
        />
      </View>
      <View style={$repsColumn}>
        <TextField
          value={exerciseSetStore.reps !== undefined ? exerciseSetStore.reps.toString() : ""}
          onChangeText={setExerciseSetReps}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="number-pad"
        />
      </View>
      <View style={[$ifCompletedColumn, $textAlignCenter]}>
        {exerciseSetStore.ifCompleted ? (
          <Ionicons name="checkbox" color="black" size={30} onPress={toggleSetStatus} />
        ) : (
          <Ionicons name="checkbox-outline" color="black" size={30} onPress={toggleSetStatus} />
        )}
      </View>
    </RowView>
  )
})

type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  exerciseName: string
  sets: SetEntryProps[]
}

const ExerciseEntry: FC = observer((props: ExerciseEntryProps) => {
  const { workoutStore } = useStores()

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      type: "Normal",
    })
  }

  const $exercise: ViewStyle = {
    marginTop: spacing.medium,
  }

  const $exerciseSetsHeader: ViewStyle = {
    justifyContent: "space-around",
    marginTop: spacing.medium,
  }

  const $exerciseActions: ViewStyle = {
    justifyContent: "space-around",
    marginTop: spacing.medium,
  }

  const $exerciseSettingsButton: ViewStyle = {
    position: "absolute",
    top: spacing.large,
    right: spacing.small,
  }

  return (
    <View>
      <TouchableOpacity
        style={$exerciseSettingsButton}
        onPress={() => console.log("exercise entry settings")}
      >
        <Icon as={Ionicons} name="ellipsis-vertical" size="lg" />
      </TouchableOpacity>

      <View style={$exercise}>
        <Text preset="bold">{"#" + props.exerciseOrder + " " + props.exerciseName}</Text>
        <Text tx="activeWorkoutScreen.addNotesPlaceholder" />

        <RowView style={$exerciseSetsHeader}>
          <Text
            tx="activeWorkoutScreen.setOrderColumnHeader"
            style={[$setOrderColumn, $textAlignCenter]}
          />
          <Text
            tx="activeWorkoutScreen.previousColumnHeader"
            style={[$previousColumn, $textAlignCenter]}
          />
          <Text
            tx="activeWorkoutScreen.weightColumnHeader"
            style={[$weightColumn, $textAlignCenter]}
          />
          <Text tx="activeWorkoutScreen.repsColumnHeader" style={[$repsColumn, $textAlignCenter]} />
          <Ionicons
            name="checkmark"
            style={[$ifCompletedColumn, $textAlignCenter]}
            color="black"
            size={30}
          />
        </RowView>
        {/* TODO: Create reuseable component for exercise sets */}
        {props.sets.map((set) => (
          <SetEntry key={set.setOrder} exerciseOrder={props.exerciseOrder} {...set} />
        ))}

        <TouchableOpacity onPress={addSet}>
          <RowView style={$exerciseActions}>
            <Text tx="activeWorkoutScreen.addSetAction" />
          </RowView>
        </TouchableOpacity>
      </View>
    </View>
  )
})

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
    const { workoutStore } = useStores()
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
          console.log(workoutStore.restTime, workoutStore.restTimeRemaining)
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

const $setOrderColumn: ViewStyle = {
  flex: 1,
}

const $previousColumn: ViewStyle = {
  flex: 2,
}

const $weightColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $repsColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $ifCompletedColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $textAlignCenter: TextStyle = {
  textAlign: "center",
}
