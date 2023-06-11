import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Icon, RowView, Screen, Text } from "app/components"
import { TabScreenProps, useMainNavigation } from "app/navigators"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, Image, ImageStyle, View, ViewStyle } from "react-native"
import { colors, spacing } from "../theme"

const tempUserAvatar = require("../../assets/images/app-icon-all.png")

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true)

  useEffect(() => {
    setIsLoadingProfile(userStore.isLoading)
    setIsLoadingWorkouts(userStore.isLoadingWorkouts)
  }, [userStore.isLoading, userStore.isLoadingWorkouts])

  function getWorkoutData() {
    const data = Array.from(userStore.workouts.values())
    return data
  }

  function renderWorkoutItem({ item }) {
    const { workoutId, workout } = item

    return (
      <View style={$workoutItem}>
        <Text>{workoutId}</Text>
        <Text>{workout.workoutTitle}</Text>
        <Text>
          {(workout.endTime as FirebaseFirestoreTypes.Timestamp).toDate().toLocaleString()}
        </Text>
      </View>
    )
  }

  return isLoadingProfile ? (
    <Text tx="common.loading" />
  ) : (
    <Screen safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      <RowView alignItems="center" style={$userAvatarRow}>
        <RowView alignItems="center">
          <Image source={tempUserAvatar} style={$userAvatar} />
          <Text style={$userDisplayName}>{userStore.displayName}</Text>
        </RowView>
        <Icon
          name="settings-outline"
          onPress={() => mainNavigation.navigate("UserSettings")}
          color={colors.actionable}
          size={32}
        />
      </RowView>

      <Text preset="subheading" tx="profileScreen.userActivities" />
      <View>
        {(() => {
          if (!isLoadingWorkouts) {
            return userStore.workouts ? (
              <FlatList data={getWorkoutData()} renderItem={renderWorkoutItem} />
            ) : (
              <Text tx="profileScreen.noActivityhistory" />
            )
          }

          return <Text tx="common.loading" />
        })()}
      </View>
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

const $userAvatar: ImageStyle = {
  height: 30,
  width: 30,
  borderRadius: 30,
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}

const $workoutItem: ViewStyle = {
  borderWidth: 1,
}
