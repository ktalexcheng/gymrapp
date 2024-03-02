import { firebase } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, RowView, Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IUserModel, IWorkoutInteractionModel, IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDate } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSummary } from "./ExerciseSummary"
import { WorkoutCommentsPanel } from "./WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "./WorkoutSocialButtonGroup"
import { WorkoutSummaryMenu } from "./WorkoutSummaryMenu"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer((props: WorkoutSummaryScreenProps) => {
  const {
    workoutSource,
    workoutId,
    workoutByUserId,
    jumpToComments,
    workout: workoutInput,
  } = props.route.params

  const mainNavigation = useMainNavigation()
  const { feedStore, userStore } = useStores()
  const [workout, setWorkout] = useState<IWorkoutSummaryModel>()
  const [workoutByUser, setWorkoutByUser] = useState<IUserModel>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCommentsPanel, setShowCommentsPanel] = useState(jumpToComments)

  const workoutLoaded = !isLoading && workout && workoutByUser

  const getWorkoutAndUser = async () => {
    console.debug("WorkoutSummaryScreen.getWorkoutAndUser called", { isLoading })
    if (isLoading) return

    setIsLoading(true)
    try {
      const _workout = feedStore.getWorkout(workoutSource, workoutId, workoutByUserId)
      if (_workout) {
        setWorkout(_workout)
      } else {
        console.debug(
          "WorkoutSummaryScreen.getWorkoutAndUser: workout not found in FeedStore, falling back to param input",
        )
        setWorkout(workoutInput)
      }
      if (workoutSource === WorkoutSource.User) {
        setWorkoutByUser(userStore.user)
      } else {
        userStore.getOtherUser(workoutByUserId).then((user) => {
          if (user) setWorkoutByUser(user)
        })
      }
    } catch (e) {
      console.error("WorkoutSummaryScreen.useEffect error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getWorkoutAndUser().then(() => setIsInitialized(true))

    const unsubscribeWorkoutInteractions = firebase
      .firestore()
      .collection("workoutInteractions")
      .doc(workoutId)
      .onSnapshot((doc) => {
        if (!doc.exists) return

        const data = convertFirestoreTimestampToDate(doc.data()) as IWorkoutInteractionModel
        console.debug("workoutInteraction update received:", {
          _likedByUserIdsCount: data?.likedByUserIds?.length,
          _commentsCount: data?.comments?.length,
          data,
        })
        feedStore.updateWorkoutInteractions(data)
      })

    return () => {
      unsubscribeWorkoutInteractions()
    }
  }, [])

  const toggleShowCommentsPanel = () => {
    setShowCommentsPanel(!showCommentsPanel)
  }

  const onWorkoutUpdated = () => {
    setIsLoading(true)
    try {
      // User should only be able to access menu of their own workouts
      const updatedWorkout = feedStore.getWorkout(WorkoutSource.User, workoutId)
      if (updatedWorkout) {
        setWorkout(updatedWorkout)
      }
    } catch (e) {
      console.error("WorkoutSummaryScreen.onWorkoutUpdated error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const renderScreen = () => {
    if (!isInitialized) return null

    if (!workoutLoaded) {
      return <Text tx="workoutSummaryScreen.workoutUnavailableMessage" />
    }

    return (
      <FlatList
        ListHeaderComponent={
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
                    mainNavigation.navigate("ProfileVisitorView", {
                      userId: workoutByUser.userId,
                    })
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

            {workout.performedAtGymName && workout.performedAtGymId && (
              <>
                <Spacer type="vertical" size="small" />
                <TouchableOpacity
                  onPress={() =>
                    // @ts-ignore
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
          </>
        }
        data={workout.exercises}
        renderItem={({ item }) => <ExerciseSummary key={item.exerciseId} exercise={item} />}
      />
    )
  }

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$screenContentContainer}
      isBusy={isLoading}
      preset="fixed" // Important because WorkoutCommentsPanel contains a FlatList, we do not want to nest FlatList in plain ScrollViews
    >
      {renderScreen()}
      {showCommentsPanel && (
        <WorkoutCommentsPanel
          workoutSource={workoutSource}
          workoutId={workoutId}
          workoutByUserId={workout.byUserId}
          toggleShowCommentsPanel={toggleShowCommentsPanel}
        />
      )}
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
