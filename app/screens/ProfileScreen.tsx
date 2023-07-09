import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Icon, RowView, Screen, Spacer, Text } from "app/components"
import { Workout } from "app/data/model"
import { TabScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { colors, spacing, styles } from "../theme"

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore, exerciseStore } = useStores()
  const [isLoadingProfile, setIsLoadingProfile] = useState(userStore.isLoading)
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(userStore.isLoadingWorkouts)

  useEffect(() => {
    setIsLoadingProfile(userStore.isLoading)
    setIsLoadingWorkouts(userStore.isLoadingWorkouts)
  }, [userStore.isLoading, userStore.isLoadingWorkouts])

  function getWorkoutData() {
    const workouts = Array.from(userStore.workouts.values())
    return workouts
  }

  function renderWorkoutItem({ item }) {
    const { workoutId, workout }: { workoutId: string; workout: Workout } = item

    const $workoutItemHeader: ViewStyle = {
      justifyContent: "space-between",
    }

    return (
      <TouchableOpacity onPress={() => mainNavigation.navigate("WorkoutSummary", { workoutId })}>
        <View style={styles.listItem}>
          <RowView style={$workoutItemHeader}>
            <Text>{workout.workoutTitle}</Text>
            <Text>
              {(workout.endTime as FirebaseFirestoreTypes.Timestamp).toDate().toLocaleString()}
            </Text>
          </RowView>
          <Spacer type="vertical" size="small" />
          {workout.exercises.map((e, i) => {
            let exerciseSummary = `${exerciseStore.getExerciseName(e.exerciseId)}: ${
              e.bestSet.weight
            } x ${e.bestSet.reps}`

            if (e.bestSet.rpe) {
              exerciseSummary += ` @ ${e.bestSet.rpe}`
            }

            return <Text key={i}>{exerciseSummary}</Text>
          })}
        </View>
      </TouchableOpacity>
    )
  }

  const isTrainer = false
  const $coachsCenterButtonStatus: ViewStyle | TextStyle = {
    backgroundColor: isTrainer ? colors.actionable : colors.disabled,
    color: isTrainer ? colors.text : colors.textDim,
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      {isLoadingProfile ? (
        <Text tx="common.loading" />
      ) : (
        <>
          <RowView alignItems="center" style={$userAvatarRow}>
            <RowView alignItems="center">
              <Avatar user={userStore.user} size="md" />
              <Text style={$userDisplayName}>{userStore?.displayName}</Text>
            </RowView>
            <Icon
              name="settings-outline"
              onPress={() => mainNavigation.navigate("UserSettings")}
              color={colors.actionable}
              size={32}
            />
          </RowView>
          <RowView style={$coachsCenterRow}>
            <TouchableOpacity style={[$coachsCenterButton, $coachsCenterButtonStatus]}>
              <Text tx="profileScreen.coachsCenterButtonLabel"></Text>
            </TouchableOpacity>
          </RowView>
          <Text preset="subheading" tx="profileScreen.userActivities" />
          <View>
            {(() => {
              if (!isLoadingWorkouts) {
                return userStore.workouts.size > 0 ? (
                  <FlatList
                    data={getWorkoutData()}
                    renderItem={renderWorkoutItem}
                    ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
                  />
                ) : (
                  <Text tx="profileScreen.noActivityhistory" />
                )
              }

              return <Text tx="common.loading" />
            })()}
          </View>
        </>
      )}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.large,
  paddingHorizontal: spacing.large,
}

const $userAvatarRow: ViewStyle = {
  justifyContent: "space-between",
  marginBottom: spacing.large,
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}

const $coachsCenterRow: ViewStyle = {
  justifyContent: "flex-end",
}

const $coachsCenterButton: ViewStyle = {
  height: 30,
  borderRadius: 15,
  paddingHorizontal: spacing.medium,
  justifyContent: "center",
}
