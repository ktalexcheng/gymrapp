import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Icon, RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { GymDetails, GymMember, User, UserId, Workout, WorkoutId } from "app/data/model"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { api } from "app/services/api"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

interface GymWorkoutsTabSceneProps {
  workouts: Workout[]
  byUsers: { [userId: string]: User }
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
            workoutSource={WorkoutSource.Feed}
            workoutId={item.workoutId}
            byUser={byUsers[item.byUserId]}
            workout={item}
          />
        )}
        keyExtractor={(item) => item.workoutId}
        onEndReachedThreshold={0.5}
        onEndReached={!noMoreWorkouts && onEndReached}
        ListFooterComponent={() => {
          if (workouts.length === 0) {
            return (
              <View style={styles.alignCenter}>
                <Text tx="gymDetailsScreen.noActivityMessage" />
              </View>
            )
          }

          if (noMoreWorkouts) {
            return (
              <View style={styles.alignCenter}>
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
  gymMembers: { [userId: string]: GymMember & User }
  onEndReached: () => void
  noMoreMembers: boolean
}

const GymMembersTabScene: FC<GymMembersTabSceneProps> = observer(
  (props: GymMembersTabSceneProps) => {
    const { gymMembers, onEndReached, noMoreMembers } = props
    const sortedGymMembers = Object.values(gymMembers).sort(
      (a, b) => b.workoutCount ?? 0 - a.workoutCount ?? 0,
    )

    const $tileContainer: ViewStyle = {
      ...styles.listItemContainer,
      justifyContent: "space-between",
    }

    const GymMemberTile = (gymMember: GymMember & User) => {
      return (
        <RowView style={$tileContainer}>
          <Text>{`${gymMember.firstName} ${gymMember.lastName}`}</Text>
          <Text>{gymMember.workoutCount ?? 0}</Text>
        </RowView>
      )
    }

    return (
      <FlatList
        data={sortedGymMembers}
        renderItem={({ item }) => <GymMemberTile {...item} />}
        keyExtractor={(item) => item.userId}
        onEndReachedThreshold={0.5}
        onEndReached={!noMoreMembers && onEndReached}
        ListFooterComponent={() => {
          if (sortedGymMembers.length === 0) {
            return (
              <View style={styles.alignCenter}>
                <Text tx="gymDetailsScreen.noActivityMessage" />
              </View>
            )
          }

          if (noMoreMembers) {
            return (
              <View style={styles.alignCenter}>
                <Text style={styles.alignCenter} tx="gymDetailsScreen.noMoreMembersMessage" />
              </View>
            )
          }

          return <ActivityIndicator />
        }}
      />
    )
  },
)

type GymDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "GymDetails">

export const GymDetailsScreen: FC = observer(({ route }: GymDetailsScreenProps) => {
  const gymId = route.params.gymId
  const { gymStore, userStore } = useStores()
  const [gymDetails, setGymDetails] = useState<GymDetails>(undefined)
  const [gymWorkouts, setGymWorkouts] = useState<Workout[]>([])
  const [lastWorkoutId, setLastWorkoutId] = useState<WorkoutId>(undefined)
  const [noMoreWorkouts, setNoMoreWorkouts] = useState(true)
  const [gymMemberProfiles, setGymMemberProfiles] = useState<{
    [userId: string]: GymMember & User
  }>({})
  const [lastMemberId, setLastMemberId] = useState<UserId>(undefined)
  const [noMoreMembers, setNoMoreMembers] = useState(true)
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
    const {
      lastWorkoutId: newLastWorkoutId,
      noMoreItems,
      workouts,
    } = await api.getGymWorkouts(gymId, lastWorkoutId)
    setLastWorkoutId(newLastWorkoutId)
    setNoMoreWorkouts(noMoreItems)
    setGymWorkouts((prev) => prev.concat(workouts))

    for (const workout of workouts) {
      const byUserId = workout.byUserId
      if (!gymMemberProfiles[byUserId]) {
        await userStore.getOtherUser(byUserId).then((user) => {
          setGymMemberProfiles((prev) => ({ ...prev, [byUserId]: user }))
        })
      }
    }
  }

  const loadMoreGymMembers = async () => {
    await gymStore.getGymMemberProfiles(gymId, lastMemberId).then((response) => {
      const { lastMemberId: newLastMemberId, noMoreItems, gymMemberProfiles } = response
      setLastWorkoutId(newLastMemberId)
      setNoMoreMembers(noMoreItems)
      for (const gymMemberProfile of gymMemberProfiles) {
        setGymMemberProfiles((prev) => ({ ...prev, [gymMemberProfile.userId]: gymMemberProfile }))
      }
    })
  }

  const renderScene = SceneMap({
    gymWorkouts: () => (
      <GymWorkoutsTabScene
        workouts={gymWorkouts}
        byUsers={gymMemberProfiles}
        onEndReached={() => {
          console.debug("GymDetailsScreen.onEndReached")
          loadMoreGymWorkouts()
        }}
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

  useEffect(() => {
    const loadInitialGymWorkouts = async () => {
      // Get workouts
      setLastWorkoutId(undefined)
      setNoMoreWorkouts(false)
      setGymWorkouts([])
      await loadMoreGymWorkouts()

      // Get members
      setLastMemberId(undefined)
      setNoMoreMembers(false)
      setGymMemberProfiles({})
      await loadMoreGymMembers()
    }

    loadInitialGymWorkouts()
  }, [])

  useEffect(() => {
    const refreshGymDetails = async () => {
      await gymStore
        .getGymById(gymId)
        .then((gym) => {
          setGymDetails(gym)
          setIsRefreshing(false)
        })
        .catch((e) => {
          console.error("GymDetailsScreen.useEffect getGymById error:", e)
          setIsRefreshing(false)
        })
    }

    refreshGymDetails()
  }, [refreshGymDetailsKey])

  const refreshGymDetails = () => {
    setIsRefreshing(true)
    setRefreshGymDetailsKey((prev) => prev + 1)
  }

  const handleAddToMyGyms = () => {
    userStore
      .addToMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleAddToMyGyms error:", e)
      })
  }

  const handleRemoveFromMyGyms = () => {
    userStore
      .removeFromMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleRemoveFromMyGyms error:", e)
      })
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
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$container}
      // preset="scroll"
      // ScrollViewProps={{
      //   refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={refreshGymDetails} />,
      // }}
    >
      <Text text={gymDetails.gymName} preset="heading" />
      <Spacer type="vertical" size="tiny" />
      <Text text={gymDetails.googleMapsPlaceDetails?.formatted_address} />
      <Spacer type="vertical" size="tiny" />
      <RowView style={$gymStatusBar}>
        <RowView style={styles.alignCenter}>
          <Icon name="people" size={16} />
          <Spacer type="horizontal" size="micro" />
          <Text>{gymDetails.gymMembersCount ?? "-"}</Text>
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
