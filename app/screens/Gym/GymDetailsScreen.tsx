import { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Button,
  Icon,
  LoadingIndicator,
  RowView,
  Screen,
  Spacer,
  TabBar,
  Text,
} from "app/components"
import { WorkoutSource } from "app/data/constants"
import { GymDetails, GymMember, UserId, WorkoutId } from "app/data/types"
import { useToast } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { api } from "app/services/api"
import { IUserModel, IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { simplifyNumber } from "app/utils/formatNumber"
import { logError } from "app/utils/logger"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

interface GymWorkoutsTabSceneProps {
  gymId: string
}

const GymWorkoutsTabScene: FC<GymWorkoutsTabSceneProps> = observer(
  (props: GymWorkoutsTabSceneProps) => {
    const { gymId } = props
    const { gymStore, userStore } = useStores()
    const [gymWorkouts, setGymWorkouts] = useState<IWorkoutSummaryModel[]>([])
    const [lastWorkoutId, setLastWorkoutId] = useState<WorkoutId>()
    const [noMoreWorkouts, setNoMoreWorkouts] = useState(false)
    const [loadingWorkouts, setLoadingWorkouts] = useState(false)
    const [gymMemberProfiles, setGymMemberProfiles] = useState<{
      [userId: string]: GymMember & IUserModel
    }>({})

    const loadMoreGymWorkouts = async () => {
      if (loadingWorkouts || noMoreWorkouts) return
      console.debug("GymWorkoutsTabScene.loadMoreGymWorkouts running", {
        noMoreWorkouts,
        lastWorkoutId,
      })
      setLoadingWorkouts(true)

      const {
        lastWorkoutId: newLastWorkoutId,
        noMoreItems,
        workouts,
      } = await api.getGymWorkouts(gymId, lastWorkoutId)
      console.debug("GymWorkoutsTabScene.loadMoreGymWorkouts getGymWorkouts response", {
        gymId,
        noMoreItems,
        newLastWorkoutId,
        workouts,
      })
      setLastWorkoutId(newLastWorkoutId)
      setNoMoreWorkouts(noMoreItems)
      setGymWorkouts((prev) => prev.concat(workouts))

      const byUserIds = workouts.map((workout) => workout.byUserId)

      for (const byUserId of byUserIds) {
        if (!gymMemberProfiles[byUserId]) {
          const gymMember = await gymStore.getGymMember(gymId, byUserId)
          const user = await userStore.getOtherUser(byUserId)

          setGymMemberProfiles((prev) => ({
            ...prev,
            [byUserId]: {
              ...gymMember,
              ...user,
            },
          }))
        }
      }

      setLoadingWorkouts(false)
    }

    return (
      <FlatList
        data={gymWorkouts}
        renderItem={({ item, index }) => {
          if (!gymMemberProfiles[item.byUserId]) return null

          return (
            <>
              {/* <Text>{index}</Text> */}
              <WorkoutSummaryCard
                workout={item}
                workoutSource={WorkoutSource.OtherUser}
                workoutId={item.workoutId}
                byUser={gymMemberProfiles[item.byUserId]}
              />
            </>
          )
        }}
        ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
        keyExtractor={(item) => item.workoutId}
        onEndReachedThreshold={0.5}
        onEndReached={loadMoreGymWorkouts}
        ListFooterComponent={() => {
          if (loadingWorkouts) return <LoadingIndicator />

          if (gymWorkouts.length === 0) {
            return (
              <View style={styles.alignCenter}>
                <Spacer type="vertical" size="medium" />
                <Text tx="gymDetailsScreen.noActivityMessage" />
              </View>
            )
          }

          if (noMoreWorkouts) {
            return (
              <View style={styles.alignCenter}>
                <Spacer type="vertical" size="medium" />
                <Text style={styles.alignCenter} tx="gymDetailsScreen.noMoreWorkoutsMessage" />
              </View>
            )
          }

          return null
        }}
      />
    )
  },
)

interface GymMembersTabSceneProps {
  gymId: string
}

const GymMembersTabScene: FC<GymMembersTabSceneProps> = observer(
  (props: GymMembersTabSceneProps) => {
    const { gymId } = props
    const { themeStore, gymStore } = useStores()
    const [gymMemberProfiles, setGymMemberProfiles] = useState<{
      [userId: string]: GymMember & IUserModel
    }>({})
    const [lastMemberId, setLastMemberId] = useState<UserId>()
    const [noMoreMembers, setNoMoreMembers] = useState(false)
    const [loadingMembers, setLoadingMembers] = useState(false)

    const sortedGymMembers = Object.values(gymMemberProfiles).sort(
      (a, b) => (b.workoutsCount ?? 0) - (a.workoutsCount ?? 0),
    )

    const loadMoreGymMembers = async () => {
      if (loadingMembers || noMoreMembers) return
      console.debug("GymDetailsScreen.loadMoreGymMembers running")
      setLoadingMembers(true)

      const {
        lastMemberId: newLastMemberId,
        noMoreItems,
        gymMemberProfiles,
      } = await gymStore.getWorkoutsLeaderboard(gymId, lastMemberId)
      console.debug("GymDetailsScreen.loadMoreGymMembers after response", {
        noMoreItems,
        newLastMemberId,
      })
      setLastMemberId(newLastMemberId)
      setNoMoreMembers(noMoreItems)

      for (const gymMemberProfile of gymMemberProfiles) {
        setGymMemberProfiles((prev) => ({ ...prev, [gymMemberProfile.userId]: gymMemberProfile }))
      }

      setLoadingMembers(false)
    }

    const $tileHeader: ViewStyle = {
      justifyContent: "space-between",
      paddingHorizontal: spacing.medium,
    }

    const $tileContainer: ViewStyle = {
      marginVertical: spacing.tiny,
      borderRadius: 10,
      paddingVertical: spacing.extraSmall,
      paddingHorizontal: spacing.medium,
      backgroundColor: themeStore.colors("contentBackground"),
      justifyContent: "space-between",
    }

    const GymMemberTile = (gymMember: GymMember & IUserModel) => {
      return (
        <RowView style={$tileContainer}>
          <Text>{`${gymMember.firstName} ${gymMember.lastName}`}</Text>
          <Text>{gymMember.workoutsCount ?? 0}</Text>
        </RowView>
      )
    }

    return (
      <>
        <RowView style={$tileHeader}>
          <Text preset="formLabel" tx="common.user" />
          <Text preset="formLabel" tx="common.workouts" />
        </RowView>
        <FlatList
          data={sortedGymMembers}
          renderItem={({ item }) => <GymMemberTile {...item} />}
          keyExtractor={(item) => item.userId}
          onEndReachedThreshold={0.5}
          onEndReached={() => !noMoreMembers && loadMoreGymMembers()}
          ListFooterComponent={() => {
            if (sortedGymMembers.length === 0) {
              return (
                <View style={styles.alignCenter}>
                  <Spacer type="vertical" size="medium" />
                  <Text tx="gymDetailsScreen.noActivityMessage" />
                </View>
              )
            }

            if (noMoreMembers) {
              return (
                <View style={styles.alignCenter}>
                  <Spacer type="vertical" size="medium" />
                  <Text style={styles.alignCenter} tx="gymDetailsScreen.noMoreMembersMessage" />
                </View>
              )
            }

            return <LoadingIndicator />
          }}
        />
      </>
    )
  },
)

type GymDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "GymDetails">

export const GymDetailsScreen = observer(({ route }: GymDetailsScreenProps) => {
  const gymId = route.params.gymId
  const { gymStore, userStore } = useStores()
  const [toastShowTx] = useToast()
  const [gymDetails, setGymDetails] = useState<GymDetails>()
  const [showEntireName, setShowEntireName] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  const routes = [
    {
      key: "gymWorkouts",
      title: translate("gymDetailsScreen.latestWorkoutsLabel"),
    },
    {
      key: "gymMembers",
      title: translate("gymDetailsScreen.gymMembersLabel"),
    },
  ]

  const renderScene = SceneMap({
    gymWorkouts: () => <GymWorkoutsTabScene gymId={gymId} />,
    gymMembers: () => <GymMembersTabScene gymId={gymId} />,
  })

  const renderTabBar = (props) => {
    const $tabBarStyle: ViewStyle = {
      marginBottom: spacing.tiny,
    }

    return (
      <View style={$tabBarStyle}>
        <TabBar tabIndex={tabIndex} setTabIndex={setTabIndex} {...props} />
      </View>
    )
  }

  useEffect(() => {
    refreshGymDetails()
  }, [])

  const refreshGymDetails = async () => {
    setIsRefreshing(true)
    await gymStore
      .getGymById(gymId)
      .then((gym) => {
        setGymDetails(gym)
      })
      .catch((e) => {
        logError(e, "GymDetailsScreen.useEffect getGymById error")
      })
      .finally(() => setIsRefreshing(false))
  }

  const handleAddToMyGyms = () => {
    if (!gymDetails) return
    if (userStore.isInMyGyms(gymId)) {
      toastShowTx("gymDetailsScreen.alreadyAddedToMyGymsLabel")
      return
    }

    setIsRefreshing(true)
    userStore
      .addToMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        logError(e, "GymDetailsScreen.handleAddToMyGyms error")
      })
      .finally(() => setIsRefreshing(false))
  }

  const handleRemoveFromMyGyms = () => {
    if (!gymDetails) return
    if (!userStore.isInMyGyms(gymId)) {
      toastShowTx("gymDetailsScreen.alreadyRemovedFromMyGymsLabel")
      return
    }

    setIsRefreshing(true)
    userStore
      .removeFromMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        logError(e, "GymDetailsScreen.handleRemoveFromMyGyms error")
      })
      .finally(() => setIsRefreshing(false))
  }

  const renderAddRemoveButton = () => {
    if (userStore.isInMyGyms(gymId)) {
      return (
        <Button
          tx="gymDetailsScreen.removeFromMyGymsLabel"
          onPress={handleRemoveFromMyGyms}
          preset="text"
        />
      )
    }

    return (
      <Button tx="gymDetailsScreen.addToMyGymsLabel" onPress={handleAddToMyGyms} preset="text" />
    )
  }

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={styles.screenContainer}
      isBusy={isRefreshing}
    >
      {gymDetails && (
        <>
          <TouchableOpacity onPress={() => setShowEntireName(!showEntireName)}>
            <Text
              text={gymDetails.gymName}
              preset="heading"
              numberOfLines={showEntireName ? undefined : 2}
            />
          </TouchableOpacity>
          <Spacer type="vertical" size="tiny" />
          <Text text={gymDetails.googleMapsPlaceDetails?.formatted_address} />
          <Spacer type="vertical" size="tiny" />
          <RowView style={$gymStatusBar}>
            <RowView style={styles.alignCenter}>
              <Icon name="barbell-outline" size={16} />
              <Spacer type="horizontal" size="micro" />
              <Text>{simplifyNumber(gymDetails.gymWorkoutsCount) ?? "-"}</Text>
              <Spacer type="horizontal" size="medium" />
              <Icon name="people" size={16} />
              <Spacer type="horizontal" size="micro" />
              <Text>{simplifyNumber(gymDetails.gymMembersCount) ?? "-"}</Text>
            </RowView>
            {renderAddRemoveButton()}
          </RowView>
          <TabView
            navigationState={{ index: tabIndex, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={setTabIndex}
          />
        </>
      )}
    </Screen>
  )
})

const $gymStatusBar: ViewStyle = {
  justifyContent: "space-between",
  paddingVertical: spacing.small,
}
