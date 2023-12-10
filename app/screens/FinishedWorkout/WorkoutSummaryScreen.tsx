import { firebase } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Text } from "app/components"
import { Workout, WorkoutInteraction } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import { LoadingScreen } from "../LoadingScreen"
import { ExerciseSummary } from "./ExerciseSummary"
import { WorkoutCommentsPanel } from "./WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "./WorkoutSocialButtonGroup"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { workoutSource, workoutId, jumpToComments } = route.params
  const { feedStore } = useStores()
  const [workout, setWorkout] = useState<Workout>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showCommentsPanel, setShowCommentsPanel] = useState<boolean>(jumpToComments)

  const toggleShowCommentsPanel = () => {
    setShowCommentsPanel(!showCommentsPanel)
  }

  useEffect(() => {
    return firebase
      .firestore()
      .collection("workoutInteractions")
      .doc(workoutId)
      .onSnapshot((doc) => {
        const data = convertFirestoreTimestampToDate(doc.data()) as WorkoutInteraction
        console.debug("workoutInteraction update received:", data)
        console.debug("workoutInteractions likes count:", data?.likedByUserIds?.length)
        console.debug("workoutInteractions comments count:", data?.comments?.length)
        if (!doc.exists) return

        feedStore.updateWorkoutInteractions(data)
      })
  }, [])

  useEffect(() => {
    const workout = feedStore.getWorkout(workoutSource, workoutId)
    console.debug("WorkoutSummaryScreen workout:", workout)
    if (workout) {
      setWorkout(workout)
      setIsLoading(false)
    }
  }, [feedStore.isLoadingFeed, feedStore.isLoadingUserWorkouts])

  if (isLoading || !workout) return <LoadingScreen />

  return (
    <>
      <Screen safeAreaEdges={["bottom"]} contentContainerStyle={$screenContentContainer}>
        <Text preset="heading">{workout.workoutTitle}</Text>
        <Text preset="subheading">{workout.startTime.toLocaleString()}</Text>
        <WorkoutSocialButtonGroup
          workoutSource={workoutSource}
          workoutId={workoutId}
          onPressComments={toggleShowCommentsPanel}
        />
        {workout.exercises.map((e, _) => {
          return <ExerciseSummary key={e.exerciseId} exercise={e} />
        })}
      </Screen>
      {showCommentsPanel && (
        <WorkoutCommentsPanel
          workoutSource={workoutSource}
          workoutId={workoutId}
          toggleShowCommentsPanel={toggleShowCommentsPanel}
        />
      )}
    </>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
