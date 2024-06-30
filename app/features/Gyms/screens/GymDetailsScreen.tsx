import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useInfiniteQuery, useQueries } from "@tanstack/react-query"
import {
  Avatar,
  Button,
  Icon,
  LoadingIndicator,
  RowView,
  Screen,
  Spacer,
  TabBar,
  Text,
  ThemedRefreshControl,
} from "app/components"
import { GymDetails, GymMember } from "app/data/types"
import { WorkoutSummaryCard } from "app/features/WorkoutSummary"
import { useToast } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { api } from "app/services/api"
import { IUserModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { simplifyNumber } from "app/utils/formatNumber"
import { logError } from "app/utils/logger"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { queries } from "../services/queryFactory"

interface GymWorkoutsTabSceneProps {
  gymId: string
  gymDetails: GymDetails
}

const GymWorkoutsTabScene: FC<GymWorkoutsTabSceneProps> = observer(
  (props: GymWorkoutsTabSceneProps) => {
    const { gymId, gymDetails } = props

    // queries
    const gymWorkoutsQuery = useInfiniteQuery({
      queryKey: ["gyms", "getWorkouts", gymId],
      queryFn: ({ pageParam }) => api.getGymWorkouts(gymId, pageParam),
      initialPageParam: "",
      getNextPageParam: (lastPage) => (lastPage.noMoreItems ? null : lastPage.lastWorkoutId),
    })
    const gymWorkouts = gymWorkoutsQuery.data?.pages?.flatMap((page) => page.workouts) ?? []
    const byUserIds = Array.from(new Set(gymWorkouts.map((workout) => workout.byUserId)))
    const gymMembersQuery = useQueries({
      queries: byUserIds
        ? byUserIds.map((userId) => ({
            ...queries.getMember(gymId, userId),
          }))
        : [],
    })
    const gymMembers = gymMembersQuery.reduce((acc, query) => {
      if (query.data) {
        acc[query.data.userId] = query.data
      }
      return acc
    }, {})

    return (
      <FlatList
        data={gymWorkouts}
        renderItem={({ item }) => {
          if (!gymMembers[item.byUserId]) return null

          return (
            <WorkoutSummaryCard
              workout={item}
              workoutId={item.workoutId}
              byUser={gymMembers[item.byUserId]}
            />
          )
        }}
        keyExtractor={(item) => item.workoutId}
        refreshControl={
          <ThemedRefreshControl
            refreshing={gymWorkoutsQuery.isFetching}
            onRefresh={() => gymWorkoutsQuery.refetch()}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => !gymWorkoutsQuery.isFetching && gymWorkoutsQuery.fetchNextPage()}
        ListHeaderComponent={() => {
          if (gymWorkouts.length > 0) {
            return (
              <Text
                preset="light"
                size="xs"
                textAlign="center"
                tx="gymDetailsScreen.onlyPublicOrFollowingActivitiesMessage"
              />
            )
          }

          return null
        }}
        ListEmptyComponent={() => {
          if (!gymWorkoutsQuery.isFetching) {
            return (
              <View style={styles.alignCenter}>
                <Spacer type="vertical" size="medium" />
                <Text
                  textAlign="center"
                  tx={
                    gymDetails.gymWorkoutsCount > 0
                      ? "gymDetailsScreen.onlyPublicOrFollowingActivitiesMessage"
                      : "gymDetailsScreen.noActivityMessage"
                  }
                />
              </View>
            )
          }

          return null
        }}
        ListFooterComponent={() => {
          if (gymWorkoutsQuery.isFetching) return <LoadingIndicator />

          if (!gymWorkoutsQuery.hasNextPage && gymWorkouts?.length > 0) {
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

    // hooks
    const { themeStore, gymStore, userStore } = useStores()
    const mainNavigation = useMainNavigation()

    // queries
    const gymMembersQuery = useInfiniteQuery({
      queryKey: ["gyms", "getWorkoutsLeaderboard", gymId],
      queryFn: ({ pageParam }) => gymStore.getWorkoutsLeaderboard(gymId, pageParam),
      initialPageParam: "",
      getNextPageParam: (lastPage) => (lastPage.noMoreItems ? null : lastPage.lastMemberId),
    })
    const gymMembers =
      gymMembersQuery.data?.pages
        ?.flatMap((page) => page.gymMemberProfiles)
        ?.sort((a, b) => (b.workoutsCount ?? 0) - (a.workoutsCount ?? 0)) ?? []

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
        <TouchableOpacity
          onPress={() => {
            if (gymMember.userId !== userStore.userId)
              mainNavigation.navigate("ProfileVisitorView", { userId: gymMember.userId })
          }}
        >
          <RowView style={$tileContainer}>
            <RowView style={styles.alignCenter}>
              <Avatar user={gymMember} size="xs" />
              <Spacer type="horizontal" size="extraSmall" />
              <Text>{`${gymMember.firstName} ${gymMember.lastName}`}</Text>
              {gymMember.userId === userStore.userId && (
                <>
                  <Spacer type="horizontal" size="extraSmall" />
                  <Text text={`(${translate("common.you")})`} />
                </>
              )}
            </RowView>
            <Text>{gymMember.workoutsCount ?? 0}</Text>
          </RowView>
        </TouchableOpacity>
      )
    }

    return (
      <>
        <RowView style={$tileHeader}>
          <Text preset="formLabel" tx="common.user" />
          <Text preset="formLabel" tx="common.workouts" />
        </RowView>
        <FlatList
          data={gymMembers}
          renderItem={({ item }) => <GymMemberTile {...item} />}
          keyExtractor={(item) => item.userId}
          refreshControl={
            <ThemedRefreshControl
              refreshing={gymMembersQuery.isFetching}
              onRefresh={() => gymMembersQuery.refetch()}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => gymMembersQuery.hasNextPage && gymMembersQuery.fetchNextPage()}
          ListEmptyComponent={() => {
            if (!gymMembersQuery.isFetching)
              return (
                <View style={styles.alignCenter}>
                  <Spacer type="vertical" size="medium" />
                  <Text tx="gymDetailsScreen.noActivityMessage" />
                </View>
              )

            return null
          }}
          ListFooterComponent={() => {
            if (!gymMembersQuery.hasNextPage && gymMembers?.length > 0) {
              return (
                <View style={styles.alignCenter}>
                  <Spacer type="vertical" size="medium" />
                  <Text style={styles.alignCenter} tx="gymDetailsScreen.noMoreMembersMessage" />
                </View>
              )
            }

            if (gymMembersQuery.isFetching) return <LoadingIndicator />

            return null
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

  const tabBarSceneMap = React.useMemo(
    () => ({
      gymWorkouts: () => <GymWorkoutsTabScene gymId={gymId} gymDetails={gymDetails!} />,
      gymMembers: () => <GymMembersTabScene gymId={gymId} />,
    }),
    [gymId, gymDetails],
  )

  const renderScene = SceneMap(tabBarSceneMap)

  const renderTabBar = (props) => {
    return (
      <TabBar
        {...props}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        style={{ marginBottom: spacing.small }}
      />
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
