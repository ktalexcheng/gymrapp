import { firebase } from "@react-native-firebase/firestore"
import { useHeaderHeight } from "@react-navigation/elements"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, RowView, Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { User, WorkoutInteraction } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDate } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSummary } from "./ExerciseSummary"
import { WorkoutCommentsPanel } from "./WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "./WorkoutSocialButtonGroup"
import { WorkoutSummaryMenu } from "./WorkoutSummaryMenu"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { workoutSource, workoutId, workout: workoutFromProps, jumpToComments } = route.params
  const mainNavigation = useMainNavigation()
  // See why useHeaderHeight() is needed: https://stackoverflow.com/questions/48420468/keyboardavoidingview-not-working-properly
  const navigationHeaderHeight = useHeaderHeight()
  const { feedStore, userStore } = useStores()
  const [workout, setWorkout] = useState(workoutFromProps)
  const [workoutByUser, setWorkoutByUser] = useState<User>(null)
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
    userStore
      .getOtherUser(workout.byUserId)
      .then((user) => setWorkoutByUser(user))
      .finally(() => setIsLoading(false))
  }, [])

  const onWorkoutUpdated = () => {
    setIsLoading(true)
    // User should only be able to access menu of their own workouts
    const updatedWorkout = feedStore.getWorkout(WorkoutSource.User, workoutId)
    if (updatedWorkout) {
      setWorkout(updatedWorkout)
    }
    setIsLoading(false)
  }

  const renderScreen = () => {
    if (!workout) return null

    return (
      <>
        <RowView style={styles.justifyBetween}>
          <View>
            <Text preset="heading">{workout.workoutTitle}</Text>
            <Text preset="subheading">{formatDate(workout.startTime)}</Text>
          </View>
          {workout.byUserId === userStore.userId && (
            <View style={$menuButton}>
              <WorkoutSummaryMenu
                workoutSource={workoutSource}
                workoutId={workoutId}
                onBusyChange={(isBusy) => setIsLoading(isBusy)}
                onWorkoutUpdated={onWorkoutUpdated}
              />
            </View>
          )}
        </RowView>

        {workoutByUser && (
          <>
            <Spacer type="vertical" size="small" />
            <TouchableOpacity
              disabled={userStore.userId === workoutByUser.userId}
              onPress={() => {
                mainNavigation.navigate("ProfileVisitorView", { userId: workoutByUser.userId })
              }}
            >
              <RowView alignItems="center">
                <Avatar user={workoutByUser} size="xs" />
                <Spacer type="horizontal" size="tiny" />
                <Text
                  weight="light"
                  text={formatName(workoutByUser.firstName, workoutByUser.lastName)}
                />
              </RowView>
            </TouchableOpacity>
          </>
        )}

        {workout.performedAtGymName && (
          <>
            <Spacer type="vertical" size="small" />
            <TouchableOpacity
              onPress={() =>
                mainNavigation.navigate("GymDetails", { gymId: workout.performedAtGymId })
              }
            >
              <Text weight="bold" numberOfLines={2}>
                {workout.performedAtGymName}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <WorkoutSocialButtonGroup
          workoutSource={workoutSource}
          workoutId={workoutId}
          workoutByUserId={workout.byUserId}
          onPressComments={toggleShowCommentsPanel}
        />
        {workout.exercises.map((e, _) => {
          return <ExerciseSummary key={e.exerciseId} exercise={e} />
        })}
        {showCommentsPanel && (
          <WorkoutCommentsPanel
            workoutSource={workoutSource}
            workoutId={workoutId}
            workoutByUserId={workout.byUserId}
            toggleShowCommentsPanel={toggleShowCommentsPanel}
          />
        )}
      </>
    )
  }

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$screenContentContainer}
      keyboardOffset={navigationHeaderHeight}
      isBusy={isLoading || !workout}
    >
      {renderScreen()}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

const $menuButton: ViewStyle = {
  marginTop: spacing.tiny,
  marginRight: spacing.tiny,
  // position: "absolute",
  // zIndex: 1,
  // top: spacing.screenPadding + spacing.tiny,
  // right: spacing.screenPadding + spacing.tiny,
}
