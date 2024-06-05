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
import { logError } from "app/utils/logger"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"
import { FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSummary } from "../components/ExerciseSummary"
import { WorkoutCommentsPanel } from "../components/WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "../components/WorkoutSocialButtonGroup"
import { WorkoutSummaryActions, WorkoutSummaryMenu } from "../components/WorkoutSummaryMenu"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer((props: WorkoutSummaryScreenProps) => {
  const { workoutSource, workoutId, workoutByUserId, jumpToComments } = props.route.params

  const mainNavigation = useMainNavigation()
  const { feedStore, userStore, themeStore } = useStores()

  const [workout, setWorkout] = useState<IWorkoutSummaryModel>()
  const [workoutByUser, setWorkoutByUser] = useState<IUserModel>()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [showCommentsPanel, setShowCommentsPanel] = useState(jumpToComments)
  const [showEntireTitle, setShowEntireTitle] = useState(false)

  const workoutLoaded = !isLoading && !!workout && !!workoutByUser
  console.debug("WorkoutSummaryScreen.render", { workoutLoaded, isLoading, workout, workoutByUser })
  const isMyWorkout = workout?.byUserId === userStore.userId
  const newRecordsCount = workout?.exercises?.reduce((acc, exercise) => {
    return acc + (exercise?.newRecords?.size ?? 0)
  }, 0)
  const workoutByUserDisplayName =
    workoutByUser && formatName(workoutByUser.firstName, workoutByUser.lastName)

  const getWorkoutAndUser = async () => {
    console.debug("WorkoutSummaryScreen.getWorkoutAndUser called", { isLoading })
    if (isLoading) return

    setIsLoading(true)
    try {
      const _workout = feedStore.getWorkout(workoutSource, workoutId)
      if (_workout) {
        setWorkout(_workout)
      } else {
        // This should not be possible
        throw new Error("Workout not found in FeedStore")
      }
      if (workoutSource === WorkoutSource.User) {
        setWorkoutByUser(userStore.user)
      } else {
        feedStore.fetchUserProfileToStore(workoutByUserId).then((user) => {
          if (user) setWorkoutByUser(user)
        })
      }
      setIsError(false)
    } catch (e) {
      logError(e, "WorkoutSummaryScreen.getWorkoutAndUser error")
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

  const refreshWorkout = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await feedStore.refreshWorkout(workoutSource, workoutByUserId, workoutId)
      getWorkoutAndUser()
    } catch (e) {
      logError(e, "WorkoutSummaryScreen.refreshWorkout error")
      setIsError(true)
    }
  }

  const $announcementContainer: ViewStyle = {
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
                <>
                  <RowView style={styles.alignCenter}>
                    <Icon name="cloud-offline-outline" size={16} />
                    <Spacer type="horizontal" size="tiny" />
                    <Text preset="light" tx="workoutSummaryScreen.workoutSavedLocallyMessage" />
                  </RowView>
                  <Spacer type="vertical" size="small" />
                </>
              )}

              {isMyWorkout && workout?.isHidden && (
                <>
                  <RowView style={styles.alignCenter}>
                    <Icon name="eye-off-outline" size={16} />
                    <Spacer type="horizontal" size="tiny" />
                    <Text preset="light" tx="workoutSummaryScreen.workoutIsHiddenMessage" />
                  </RowView>
                  <Spacer type="vertical" size="small" />
                </>
              )}

              <RowView style={[styles.flex1, styles.justifyBetween]}>
                <View style={styles.flex1}>
                  <TouchableOpacity onPress={() => setShowEntireTitle((prev) => !prev)}>
                    <Text
                      size="lg"
                      style={$workoutTitleText}
                      text={workout.workoutTitle}
                      numberOfLines={showEntireTitle ? undefined : 2}
                    />
                  </TouchableOpacity>
                  <Spacer type="vertical" size="extraSmall" />
                  <Text size="sm" style={$workoutDateText} text={formatDate(workout.startTime)} />
                </View>
                <View style={$menuButton}>
                  <WorkoutSummaryMenu
                    workoutSource={workoutSource}
                    workoutId={workoutId}
                    onBusyChange={(isBusy) => setIsLoading(isBusy)}
                    enabledActionItems={[
                      WorkoutSummaryActions.SaveAsTemplate,
                      ...(isMyWorkout
                        ? [WorkoutSummaryActions.EditWorkout, WorkoutSummaryActions.DeleteWorkout]
                        : []),
                    ]}
                  />
                </View>
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

              <View style={{ gap: spacing.small }}>
                {workout?.isEdited && (
                  <RowView style={$announcementContainer}>
                    <Icon name="warning-outline" color={themeStore.colors("danger")} size={24} />
                    <Spacer type="horizontal" size="extraSmall" />
                    <Text
                      style={styles.flex1}
                      preset="light"
                      size="xs"
                      tx="workoutSummaryScreen.workoutEditedMessage"
                    />
                  </RowView>
                )}

                {newRecordsCount > 0 && (
                  <RowView style={$announcementContainer}>
                    <Icon name="trophy" color={themeStore.colors("logo")} size={24} />
                    <Spacer type="horizontal" size="extraSmall" />
                    <Text
                      style={styles.flex1}
                      preset="light"
                      size="xs"
                      tx={
                        workoutByUserId === userStore.userId
                          ? "workoutSummaryScreen.newRecordsMessageForYou"
                          : "workoutSummaryScreen.newRecordsMessageForOthers"
                      }
                      txOptions={{ displayName: workoutByUserDisplayName, newRecordsCount }}
                    />
                  </RowView>
                )}
              </View>
            </>
          }
          data={workout.exercises}
          renderItem={({ item }) => (
            <ExerciseSummary key={item.exerciseId} byUserId={workoutByUserId} exercise={item} />
          )}
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
      contentContainerStyle={styles.screenContainer}
      isBusy={isLoading}
      preset="fixed" // Important because WorkoutCommentsPanel contains a FlatList, we do not want to nest FlatList in plain ScrollViews
    >
      {renderScreen()}
    </Screen>
  )
})

const $menuButton: ViewStyle = {
  marginTop: spacing.tiny,
  marginRight: spacing.tiny,
  // position: "absolute",
  // zIndex: 1,
  // top: spacing.screenPadding + spacing.tiny,
  // right: spacing.screenPadding + spacing.tiny,
}

const $workoutTitleText: TextStyle = {
  fontFamily: "lexendExaBold",
  lineHeight: 24,
}

const $workoutDateText: TextStyle = {
  fontFamily: "lexendExaRegular",
}
