import Ionicons from "@expo/vector-icons/Ionicons"
import { ActivityStackScreenProps } from "app/navigators/ActivityNavigator"
import { observer } from "mobx-react-lite"
import moment from "moment"
import React, { FC, useEffect, useState } from "react"
import {
  Modal,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
import { Screen, Text } from "../components"
import { useStores } from "../models"
import { colors, spacing } from "../theme"

type SaveWorkoutDialogProps = {
  visible: boolean
  onSave: () => void
  onCancel: () => void
}

const SaveWorkoutDialog: FC<SaveWorkoutDialogProps> = function SaveWorkoutDialog(
  props: SaveWorkoutDialogProps,
) {
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

function formatDuration(d: moment.Duration): string {
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
  const [completed, setCompleted] = useState(props.ifCompleted)

  function toggleSetStatus() {
    setCompleted(!completed)
    workoutStore.updateSetStatus(props.exerciseOrder, props.setOrder, completed)
  }

  return (
    <View style={$exerciseSets}>
      <RowView style={$exerciseSet}>
        <Text>{props.setOrder}</Text>
        <Text text="N/A" />
        <Text>{props.weight}</Text>
        <Text>{props.reps}</Text>
        {completed ? (
          <Ionicons name="checkbox" color="black" size={30} onPress={toggleSetStatus} />
        ) : (
          <Ionicons name="checkbox-outline" color="black" size={30} onPress={toggleSetStatus} />
        )}
      </RowView>
    </View>
  )
})

type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  sets: SetEntryProps[]
}

const ExerciseEntry: FC = observer((props: ExerciseEntryProps) => {
  const { workoutStore } = useStores()

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      type: "Normal",
      weight: 123,
      reps: 5,
    })
  }

  return (
    <View>
      <View style={$exercise}>
        <Text preset="bold">{"#" + props.exerciseOrder + " " + props.exerciseId}</Text>
        <Text text="Add notes..." />

        <RowView style={$exerciseSetsHeader}>
          <Text text="Set" />
          <Text text="Previous" />
          <Text text="Weight" />
          <Text text="Reps" />
          <Ionicons name="checkmark" color="black" size={30} />
        </RowView>
        {/* TODO: Create reuseable component for exercise sets */}
        {props.sets.map((set) => (
          <SetEntry key={set.setOrder} exerciseOrder={props.exerciseOrder} {...set} />
        ))}

        <TouchableOpacity onPress={addSet}>
          <RowView style={$exerciseActions}>
            <Text text="Add set" />
          </RowView>
        </TouchableOpacity>
      </View>
    </View>
  )
})

interface RowViewProps extends React.PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>
}

const RowView: FC<RowViewProps> = observer(({ children, style, ...props }) => {
  const $rowView: ViewStyle = {
    flexDirection: "row",
  }

  return (
    <View style={[style, $rowView]} {...props}>
      {children}
    </View>
  )
})

interface ActiveWorkoutScreenProps extends ActivityStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen() {
    const { workoutStore } = useStores()
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [timeElapsed, setTimeElapsed] = useState("")

    useEffect(() => {
      const updateTimeElapsed = () => {
        const start = moment(workoutStore.startTime)
        const duration = moment.duration(moment().diff(start))
        const formatted = formatDuration(duration)

        setTimeElapsed(formatted)
      }

      const intervalId = setInterval(updateTimeElapsed, 1000)

      // Function called when component unmounts
      return () => {
        clearInterval(intervalId)
      }
    }, [])

    function tryEndWorkout() {
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
      workoutStore.addExercise("TEST_EXERCISE")
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
            <Ionicons name="stopwatch-outline" color="black" size={30} />
          </RowView>
          <Text tx="activeWorkoutScreen.newActiveWorkoutTitle" preset="bold" />
          {/* TODO: Active workout title should be dependent on the template used */}
          <Text
            tx="activeWorkoutScreen.endWorkoutButton"
            style={$endWorkoutButton}
            onPress={tryEndWorkout}
          />
        </RowView>

        {/* TODO: Dynamically update metrics as workout progresses */}
        <RowView style={$metricsRow}>
          {/* <Text text={timeElapsed} style={$metric} /> */}
          <Text style={$metric}>{timeElapsed}</Text>
          <Text text="Metric 2" style={$metric} />
          <Text text="Metric 3" style={$metric} />
        </RowView>

        {/* TODO: Create reuseable component for exercise */}
        {workoutStore.exercises.map((exercise) => (
          <ExerciseEntry key={exercise.exerciseOrder} {...exercise} />
        ))}

        <TouchableOpacity onPress={addExercise}>
          <RowView style={$addExercise}>
            <Text text="Add exercise" />
          </RowView>
        </TouchableOpacity>
      </Screen>
    )
  },
)

const $container: ViewStyle = {
  padding: spacing.screen,
}

const $workoutHeaderRow: ViewStyle = {
  justifyContent: "space-between",
}

const $endWorkoutButton: TextStyle = {
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

const $exercise: ViewStyle = {
  marginTop: spacing.medium,
}

const $exerciseSets: ViewStyle = {
  marginTop: spacing.medium,
}

const $exerciseSetsHeader: ViewStyle = {
  justifyContent: "space-around",
}

const $exerciseSet: ViewStyle = {
  justifyContent: "space-around",
}

const $exerciseActions: ViewStyle = {
  justifyContent: "space-around",
  marginTop: spacing.medium,
}

const $addExercise: ViewStyle = {
  justifyContent: "space-around",
  marginTop: spacing.medium,
}

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
