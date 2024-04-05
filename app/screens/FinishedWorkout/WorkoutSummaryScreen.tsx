import { firebase } from "@react-native-firebase/firestore"
import { useFocusEffect } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Icon, RowView, Screen, Spacer, Text, ThemedRefreshControl } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IUserModel, IWorkoutInteractionModel, IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDate } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"
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
  const { feedStore, userStore, themeStore } = useStores()
  const [workout, setWorkout] = useState<IWorkoutSummaryModel>()
  const [workoutByUser, setWorkoutByUser] = useState<IUserModel>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [showCommentsPanel, setShowCommentsPanel] = useState(jumpToComments)

  const workoutLoaded = !isLoading && workout && workoutByUser
  const isMyWorkout = workout?.byUserId === userStore.userId

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
      setIsError(false)
    } catch (e) {
      console.error("WorkoutSummaryScreen.useEffect error:", e)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // In case the workout is updated, we want to refresh every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      getWorkoutAndUser().finally(() => setIsInitialized(true))
    }, []),
  )

  useEffect(() => {
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

  // const onWorkoutUpdated = () => {
  //   setIsLoading(true)
  //   try {
  //     // User should only be able to access menu of their own workouts
  //     const updatedWorkout = feedStore.getWorkout(WorkoutSource.User, workoutId)
  //     if (updatedWorkout) {
  //       setWorkout(updatedWorkout)
  //     }
  //   } catch (e) {
  //     console.error("WorkoutSummaryScreen.onWorkoutUpdated error:", e)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const refreshWorkout = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await feedStore.refreshWorkout(workoutSource, workoutByUserId, workoutId)
      getWorkoutAndUser()
    } catch (e) {
      console.error("WorkoutSummaryScreen.refreshWorkout error:", e)
      setIsError(true)
    }
  }

  const $isEditedWarning: ViewStyle = {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: themeStore.colors("contentBackground"),
    padding: spacing.extraSmall,
  }

  const renderScreen = () => {
    if (!isInitialized) return null

    if (!workoutLoaded && isError) {
      return <Text tx="workoutSummaryScreen.workoutUnavailableMessage" />
    }

    return (
      <>
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={isLoading} onRefresh={refreshWorkout} />
          }
          ListHeaderComponent={
            <>
              {isMyWorkout && workout?.__isOnlyLocal && (
                <RowView style={styles.alignCenter}>
                  <Icon name="cloud-offline-outline" size={16} />
                  <Spacer type="horizontal" size="tiny" />
                  <Text preset="light" tx="workoutSummaryScreen.workoutSavedLocallyMessage" />
                </RowView>
              )}

              <RowView style={styles.justifyBetween}>
                <View>
                  <Text preset="heading">{workout.workoutTitle}</Text>
                  <Text preset="subheading">{formatDate(workout.startTime)}</Text>
                </View>
                {isMyWorkout && (
                  <View style={$menuButton}>
                    <WorkoutSummaryMenu
                      workoutSource={workoutSource}
                      workoutId={workoutId}
                      onBusyChange={(isBusy) => setIsLoading(isBusy)}
                      // onWorkoutUpdated={onWorkoutUpdated}
                    />
                  </View>
                )}
              </RowView>

              {workoutByUser && (
                <>
                  <Spacer type="vertical" size="small" />
                  <TouchableOpacity
                    disabled={isMyWorkout}
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

              {workout?.isEdited && (
                <RowView style={$isEditedWarning}>
                  <Icon name="warning-outline" size={16} />
                  <Spacer type="horizontal" size="tiny" />
                  <View style={styles.flex1}>
                    <Text preset="light" tx="workoutSummaryScreen.workoutEditedMessage" size="xs" />
                  </View>
                </RowView>
              )}
            </>
          }
          data={workout.exercises}
          renderItem={({ item }) => <ExerciseSummary key={item.exerciseId} exercise={item} />}
        />

        {/* Having WorkoutCommentsPanel after the FlatList matters to achieve an overlay */}
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
      isBusy={isLoading}
      preset="fixed" // Important because WorkoutCommentsPanel contains a FlatList, we do not want to nest FlatList in plain ScrollViews
    >
      {renderScreen()}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
  overflow: "hidden", // Hides the overflow of the comments panel at the bottom
}

const $menuButton: ViewStyle = {
  marginTop: spacing.tiny,
  marginRight: spacing.tiny,
  // position: "absolute",
  // zIndex: 1,
  // top: spacing.screenPadding + spacing.tiny,
  // right: spacing.screenPadding + spacing.tiny,
}
