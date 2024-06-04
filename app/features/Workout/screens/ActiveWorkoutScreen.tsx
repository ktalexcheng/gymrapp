import { useFocusEffect } from "@react-navigation/native"
import { Button, Icon, RowView, Screen, Text } from "app/components"
import { ExerciseSettingsType, Gym } from "app/data/types"
import { useToast } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExerciseModel, SetPropType, useStores } from "app/stores"
import { fontSize, spacing, styles } from "app/theme"
import { getUserLocation } from "app/utils/getUserLocation"
import { logError } from "app/utils/logger"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useRef, useState } from "react"
import { AppState, TextStyle, View, ViewStyle } from "react-native"
import { WorkoutEditor } from "../../WorkoutEditor"
import { ActiveWorkoutHeader } from "../components/ActiveWorkoutHeader"

type GymLocationBarProps = {
  gymName?: string
  onPress: () => void
  onClear: () => void
}

const GymLocationBar = (props: GymLocationBarProps) => {
  const { gymName, onPress, onClear } = props
  const [toastShowTx] = useToast()
  const { themeStore, activeWorkoutStore: workoutStore, userStore, gymStore } = useStores()

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

  useEffect(() => {
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

  return (
    <RowView style={styles.alignCenter}>
      <View style={styles.flex1}>
        <Button
          preset="text"
          numberOfLines={1}
          onPress={onPress}
          text={gymName ?? translate("activeWorkoutScreen.setCurrentGymLabel")}
          style={$gymTextButton}
          LeftAccessory={() => (
            <Icon name="location-sharp" color={themeStore.colors("foreground")} size={30} />
          )}
        />
      </View>
      <Icon name="close-outline" onPress={onClear} size={30} />
    </RowView>
  )
}

const $gymTextButton: ViewStyle = {
  justifyContent: "flex-start",
}

const WorkoutEditorHeaderComponents = observer(() => {
  const mainNavigation = useMainNavigation()
  const { themeStore, activeWorkoutStore: workoutStore } = useStores()

  const [timeElapsed, setTimeElapsed] = useState("00:00:00")
  const [timeSinceLastSet, setTimeSinceLastSet] = useState("00:00")

  // workoutStore.timeElapsedFormatted and workoutStore.timeSinceLastSetFormatted
  // cannot be relied upon to be reactive, because the actual state (startTime, lastSetCompletedTime)
  // remains the same, we are calculating the formatted time based on the current time.
  // @ts-ignore: Not all paths return a value
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

  const $metric: ViewStyle = {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: themeStore.colors("separator"),
    flex: 1,
    padding: spacing.small,
    margin: spacing.extraSmall,
  }

  return (
    <>
      <GymLocationBar
        gymName={workoutStore.performedAtGymName ?? undefined}
        onPress={() => mainNavigation.navigate("WorkoutGymPicker")}
        onClear={() => {
          workoutStore.setProp("performedAtGymId", null)
          workoutStore.setProp("performedAtGymName", null)
        }}
      />

      {/* Active workout metrics */}
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
    </>
  )
})

interface ActiveWorkoutScreenProps extends MainStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen() {
    const mainNavigation = useMainNavigation()
    const { activeWorkoutStore: workoutStore, exerciseStore } = useStores()

    const restTimeRunningRef = useRef(workoutStore.restTimeRunning)

    // For capturing current state in closure
    useEffect(() => {
      restTimeRunningRef.current = workoutStore.restTimeRunning
    }, [workoutStore.restTimeRunning]) // To trigger useEffect on restTimeRunning change

    // Dismiss stale rest timer notification when app is resumed from background
    useEffect(() => {
      const subscribeAppStateChange = AppState.addEventListener("change", (state) => {
        console.debug("ActiveWorkoutScreen AppState changed to", state)
        if (state === "active" && !restTimeRunningRef.current) {
          console.debug(
            "ActiveWorkoutScreen AppState.addEventListener: dismiss exercise rest notifications",
          )
          workoutStore.dismissRestNotifications()
        }
      })

      return () => subscribeAppStateChange.remove()
    }, [])

    // Dismiss stale rest timer notification when user navigates back to this screen
    // Set a 3 second delay to allow the notification to be displayed briefly
    useFocusEffect(
      useCallback(() => {
        console.debug("ActiveWorkoutScreen useFocusEffect triggered")
        if (!workoutStore.restTimeRunning) {
          console.debug("ActiveWorkoutScreen useFocusEffect: dismiss exercise rest notifications")
          const timeout = setTimeout(() => workoutStore.dismissRestNotifications(), 3000)
          return () => clearTimeout(timeout)
        }
        return undefined
      }, [workoutStore.restTimeRunning]),
    )

    const onChangeExerciseSettings = (
      exerciseId: string,
      settingItem: ExerciseSettingsType,
      value: any,
    ) => {
      exerciseStore.updateExerciseSetting(exerciseId, settingItem, value)
    }

    const onChangeExerciseNotes = (exerciseOrder: number, value: string) => {
      workoutStore.updateExerciseNotes(exerciseOrder, value)
    }

    const onAddExercise = (exercise: IExerciseModel) => {
      workoutStore.addExercise(exercise)
    }

    const onRemoveExercise = (exerciseOrder: number) => {
      workoutStore.removeExercise(exerciseOrder)
    }

    const onChangeSetValue = (
      exerciseOrder: number,
      setOrder: number,
      prop: SetPropType | "isCompleted",
      value: number | null | boolean,
    ) => {
      workoutStore.updateSetValues(exerciseOrder, setOrder, prop, value)
    }

    const onAddSet = (exerciseOrder: number) => {
      workoutStore.addSet(exerciseOrder)
    }

    const onRemoveSet = (exerciseOrder: number, setOrder: number) => {
      workoutStore.removeSet(exerciseOrder, setOrder)
    }

    const onFinishWorkout = () => {
      mainNavigation.navigate("SaveWorkout")
    }

    return (
      <Screen
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={styles.screenContainer}
        preset="fixed"
      >
        <ActiveWorkoutHeader
          workoutTitle={workoutStore.workoutTitle}
          onChangeWorkoutTitle={workoutStore.setProp.bind(workoutStore, "workoutTitle")}
          isRestTimerRunning={workoutStore.restTimeRunning}
          restTimeRemaining={workoutStore.restTimeRemaining}
          totalRestTime={workoutStore.restTime}
          onFinishWorkout={onFinishWorkout}
        />

        <WorkoutEditor
          workoutNotes={workoutStore.workoutNotes}
          onChangeWorkoutNotes={workoutStore.setProp.bind(workoutStore, "workoutNotes")}
          allExercises={workoutStore.exercises}
          enableExerciseSettingsMenuItems={Object.values(ExerciseSettingsType)}
          onChangeExerciseSettings={onChangeExerciseSettings}
          onChangeExerciseNotes={onChangeExerciseNotes}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onChangeSetValue={onChangeSetValue}
          onAddSet={onAddSet}
          onRemoveSet={onRemoveSet}
          onCompleteSet={({ autoRestTimerEnabled, restTime }) => {
            if (autoRestTimerEnabled) {
              workoutStore.restartRestTimer(restTime)
            }
          }}
          ExtraHeaderComponent={WorkoutEditorHeaderComponents}
        />
      </Screen>
    )
  },
)

const $metricsRow: ViewStyle = {
  justifyContent: "space-between",
}

const $metricLabel: TextStyle = {
  fontSize: fontSize.tiny,
}
