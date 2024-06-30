import { firebase } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Icon, RowView, Screen, Spacer, Text, ThemedRefreshControl } from "app/components"
import { useGetUser } from "app/features/UserProfile/services/useGetUser"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IWorkoutInteractionModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDateTime } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSummary } from "../components/ExerciseSummary"
import { WorkoutCommentsPanel } from "../components/WorkoutCommentsPanel"
import { WorkoutSocialButtonGroup } from "../components/WorkoutSocialButtonGroup"
import { WorkoutSummaryActions, WorkoutSummaryMenu } from "../components/WorkoutSummaryMenu"
import { useGetWorkout } from "../services/useGetWorkout"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer((props: WorkoutSummaryScreenProps) => {
  const { workoutId, jumpToComments } = props.route.params

  // hooks
  const mainNavigation = useMainNavigation()
  const { feedStore, userStore, themeStore } = useStores()

  // queries
  const workoutQuery = useGetWorkout(workoutId)
  const workout = workoutQuery.data
  const workoutByUserId = workout?.byUserId
  const workoutByUserQuery = useGetUser(workoutByUserId)
  const workoutByUser = workoutByUserQuery.data

  // states
  const [showCommentsPanel, setShowCommentsPanel] = useState(jumpToComments)
  const [showEntireTitle, setShowEntireTitle] = useState(false)

  // derived states
  const isReadyForDisplay = workout && workoutByUserId && workoutByUser
  const isLoading = workoutQuery.isLoading || workoutByUserQuery.isLoading
  const isError = workoutQuery.isError || workoutByUserQuery.isError
  const isMyWorkout = workout?.byUserId === userStore.userId
  const newRecordsCount =
    workout?.exercises?.reduce((acc, exercise) => {
      return acc + (exercise?.newRecords?.size ?? 0)
    }, 0) ?? -1
  const workoutByUserDisplayName =
    workoutByUser && formatName(workoutByUser.firstName, workoutByUser.lastName)

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
    workoutQuery.refetch()
  }

  const $announcementContainer: ViewStyle = {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: themeStore.colors("contentBackground"),
    padding: spacing.extraSmall,
  }

  const renderScreen = () => {
    if (!isReadyForDisplay) return null

    if (isError) {
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
              {isMyWorkout && workout?.__isLocalOnly && (
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
                  <Text
                    size="sm"
                    style={$workoutDateText}
                    text={formatDateTime(workout.startTime)}
                  />
                </View>
                <View style={$menuButton}>
                  <WorkoutSummaryMenu
                    workoutId={workoutId}
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
                      mainNavigation.navigate("GymDetails", { gymId: workout.performedAtGymId! })
                    }
                  >
                    <Text weight="bold" numberOfLines={2}>
                      {workout.performedAtGymName}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <WorkoutSocialButtonGroup
                workoutId={workoutId}
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

              {workout.workoutNotes && (
                <>
                  <Spacer type="vertical" size="small" />
                  <RowView style={{ gap: spacing.small }}>
                    <Text style={styles.flex1} text={workout.workoutNotes} preset="light" />
                  </RowView>
                </>
              )}
            </>
          }
          data={workout.exercises}
          renderItem={({ item }) => (
            <ExerciseSummary
              key={item.exerciseId}
              isTemplate={false}
              byUserId={workoutByUserId}
              exercise={item}
            />
          )}
        />

        {/* Having WorkoutCommentsPanel after the FlatList matters to achieve an overlay */}
        {showCommentsPanel && (
          <WorkoutCommentsPanel
            workoutId={workoutId}
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
}

const $workoutTitleText: TextStyle = {
  fontFamily: "lexendExaBold",
  lineHeight: 24,
}

const $workoutDateText: TextStyle = {
  fontFamily: "lexendExaRegular",
}
