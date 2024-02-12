import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Icon, RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { GymDetails, GymMember, UserId, WorkoutId } from "app/data/types"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { api } from "app/services/api"
import { IUserModel, IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { simplifyNumber } from "app/utils/formatNumber"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

interface GymWorkoutsTabSceneProps {
  workouts: IWorkoutSummaryModel[]
  byUsers: { [userId: string]: IUserModel }
  onEndReached: () => void
  noMoreWorkouts: boolean
}

const GymWorkoutsTabScene: FC<GymWorkoutsTabSceneProps> = observer(
  (props: GymWorkoutsTabSceneProps) => {
    const { workouts, byUsers, onEndReached, noMoreWorkouts } = props

    return (
      <FlatList
        data={workouts}
        renderItem={({ item }) => (
          <WorkoutSummaryCard
            workout={item}
            workoutSource={WorkoutSource.Feed}
            workoutId={item.workoutId}
            byUser={byUsers[item.byUserId]}
          />
        )}
        ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
        keyExtractor={(item) => item.workoutId}
        onEndReachedThreshold={0.5}
        onEndReached={() => !noMoreWorkouts && onEndReached()}
        ListFooterComponent={() => {
          if (workouts.length === 0) {
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

          return <ActivityIndicator />
        }}
      />
    )
  },
)

interface GymMembersTabSceneProps {
  gymMembers: { [userId: string]: GymMember & IUserModel }
  onEndReached: () => void
  noMoreMembers: boolean
}

const GymMembersTabScene: FC<GymMembersTabSceneProps> = observer(
  (props: GymMembersTabSceneProps) => {
    const { gymMembers, onEndReached, noMoreMembers } = props
    const { themeStore } = useStores()
    const sortedGymMembers = Object.values(gymMembers).sort(
      (a, b) => b.workoutsCount ?? 0 - a.workoutsCount ?? 0,
    )

    const $tileHeader: ViewStyle = {
      justifyContent: "space-between",
      paddingHorizontal: spacing.medium,
    }

    const $tileContainer: ViewStyle = {
      // ...styles.listItemContainer,
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
          onEndReached={() => !noMoreMembers && onEndReached()}
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

            return <ActivityIndicator />
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
  const [gymDetails, setGymDetails] = useState<GymDetails>()
  const [showEntireName, setShowEntireName] = useState(false)
  const [gymWorkouts, setGymWorkouts] = useState<IWorkoutSummaryModel[]>([])
  const [lastWorkoutId, setLastWorkoutId] = useState<WorkoutId>()
  const [noMoreWorkouts, setNoMoreWorkouts] = useState(false)
  const [loadingWorkouts, setLoadingWorkouts] = useState(false)
  const [gymMemberProfiles, setGymMemberProfiles] = useState<{
    [userId: string]: GymMember & IUserModel
  }>({})
  const [lastMemberId, setLastMemberId] = useState<UserId>()
  const [noMoreMembers, setNoMoreMembers] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshGymDetailsKey, setRefreshGymDetailsKey] = useState(0)
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

  const loadMoreGymWorkouts = async () => {
    console.debug("GymDetailsScreen.loadMoreGymWorkouts called", { noMoreWorkouts, lastWorkoutId })
    if (loadingWorkouts || noMoreWorkouts) return
    setLoadingWorkouts(true)

    const {
      lastWorkoutId: newLastWorkoutId,
      noMoreItems,
      workouts,
    } = await api.getGymWorkouts(gymId, lastWorkoutId)
    console.debug("GymDetailsScreen.loadMoreGymWorkouts after response", {
      noMoreItems,
      newLastWorkoutId,
    })
    setLastWorkoutId(newLastWorkoutId)
    setNoMoreWorkouts(noMoreItems)
    setGymWorkouts((prev) => prev.concat(workouts))

    for (const workout of workouts) {
      const byUserId = workout.byUserId
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

  const loadMoreGymMembers = async () => {
    console.debug("GymDetailsScreen.loadMoreGymMembers called", { noMoreMembers, lastMemberId })
    if (loadingMembers || noMoreMembers) return
    setLoadingMembers(true)

    const {
      lastMemberId: newLastMemberId,
      noMoreItems,
      gymMemberProfiles,
    } = await gymStore.getGymMemberProfiles(gymId, lastMemberId)
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

  const renderScene = SceneMap({
    gymWorkouts: () => (
      <GymWorkoutsTabScene
        workouts={gymWorkouts}
        byUsers={gymMemberProfiles}
        onEndReached={loadMoreGymWorkouts}
        noMoreWorkouts={noMoreWorkouts}
      />
    ),
    gymMembers: () => (
      <GymMembersTabScene
        gymMembers={gymMemberProfiles}
        onEndReached={loadMoreGymMembers}
        noMoreMembers={noMoreMembers}
      />
    ),
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

  // useEffect(() => {
  //   const loadInitialGymWorkouts = async () => {
  //     // Get workouts
  //     setLastWorkoutId(undefined)
  //     setNoMoreWorkouts(false)
  //     setGymWorkouts([])
  //     await loadMoreGymWorkouts()

  //     // Get members
  //     setLastMemberId(undefined)
  //     setNoMoreMembers(false)
  //     setGymMemberProfiles({})
  //     await loadMoreGymMembers()
  //   }

  //   loadInitialGymWorkouts()
  // }, [])

  useEffect(() => {
    const refreshGymDetails = async () => {
      setIsRefreshing(true)
      await gymStore
        .getGymById(gymId)
        .then((gym) => {
          setGymDetails(gym)
        })
        .catch((e) => {
          console.error("GymDetailsScreen.useEffect getGymById error:", e)
        })
        .finally(() => setIsRefreshing(false))
    }

    refreshGymDetails()
  }, [refreshGymDetailsKey])

  const refreshGymDetails = () => {
    setRefreshGymDetailsKey((prev) => prev + 1)
  }

  const handleAddToMyGyms = () => {
    if (!gymDetails) return

    setIsRefreshing(true)
    userStore
      .addToMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleAddToMyGyms error:", e)
      })
      .finally(() => setIsRefreshing(false))
  }

  const handleRemoveFromMyGyms = () => {
    if (!gymDetails) return

    setIsRefreshing(true)
    userStore
      .removeFromMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleRemoveFromMyGyms error:", e)
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

  if (!gymDetails) return null

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={$container} isBusy={isRefreshing}>
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
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

const $gymStatusBar: ViewStyle = {
  justifyContent: "space-between",
  paddingVertical: spacing.small,
}
