import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query"
import {
  Avatar,
  Button,
  RowView,
  Screen,
  Spacer,
  TabBar,
  Text,
  ThemedRefreshControl,
} from "app/components"
import { FirebaseSnapshotType } from "app/data/repository"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IUserModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatName } from "app/utils/formatName"
import { simplifyNumber } from "app/utils/formatNumber"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { Alert, FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { TabView } from "react-native-tab-view"

const FollowerTile = observer((followerProfile: IUserModel & { isFollowingUser: boolean }) => {
  // hooks
  const { userStore } = useStores()
  const mainNavigation = useMainNavigation()

  // states
  const [isFollowerRemoved, setIsFollowerRemoved] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const removeFollower = () => {
    setIsLoading(true)
    userStore
      .removeFollower(followerProfile.userId)
      .then(() => setIsFollowerRemoved(true))
      .finally(() => setIsLoading(false))
  }

  const addFollower = () => {
    setIsLoading(true)
    userStore
      .addFollower(followerProfile.userId)
      .then(() => setIsFollowerRemoved(false))
      .finally(() => setIsLoading(false))
  }

  const $container: ViewStyle = {
    paddingHorizontal: spacing.tiny,
    paddingVertical: spacing.small,
    justifyContent: "space-between",
  }

  return (
    <TouchableOpacity
      onPress={() =>
        mainNavigation.navigate("ProfileVisitorView", { userId: followerProfile.userId })
      }
    >
      <RowView style={$container}>
        <RowView style={styles.flex1}>
          <Avatar user={followerProfile} />
          <Spacer type="horizontal" size="small" />
          <View style={styles.flex1}>
            <Text weight="bold" numberOfLines={1} text={followerProfile.userHandle} />
            <Text
              numberOfLines={1}
              text={formatName(followerProfile.firstName, followerProfile.lastName)}
            />
          </View>
        </RowView>
        <View>
          {isFollowerRemoved ? (
            <Button
              isBusy={isLoading}
              preset="reversed"
              tx="userConnectionsScreen.followers.undoRemoveFollowerButtonLabel"
              onPress={addFollower}
            />
          ) : (
            <Button
              isBusy={isLoading}
              tx="userConnectionsScreen.followers.removeFollowerButtonLabel"
              onPress={removeFollower}
            />
          )}
        </View>
      </RowView>
    </TouchableOpacity>
  )
})

const FollowersTabScene = (props: {
  query: UseInfiniteQueryResult
  followers: (IUserModel & { isFollowingUser: boolean })[]
}) => {
  const { query, followers } = props

  const $container: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  }

  if (query.isError) {
    return <Text tx="common.error.unknownErrorMessage" />
  }

  return (
    <View style={$container}>
      <FlatList
        data={followers}
        renderItem={({ item }) => <FollowerTile {...item} />}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        refreshControl={
          <ThemedRefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
        }
      />
    </View>
  )
}

const FollowingTile = observer((followingProfile: IUserModel) => {
  // hooks
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()

  // states
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true)
  const [isRequestSent, setIsRequestSent] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const doUnfollow = () => {
    setIsLoading(true)
    userStore
      .unfollowUser(followingProfile.userId)
      .then(() => setIsFollowingUser(false))
      .finally(() => setIsLoading(false))
  }

  const unfollow = () => {
    if (followingProfile?.privateAccount) {
      Alert.alert(
        translate("userConnectionsScreen.following.confirmUnfollowTitle", {
          userHandle: followingProfile.userHandle,
        }),
        translate("userConnectionsScreen.following.confirmUnfollowMessage", {
          userHandle: followingProfile.userHandle,
        }),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("userConnectionsScreen.following.unfollowButtonLabel"),
            style: "destructive",
            onPress: doUnfollow,
          },
        ],
      )
      return
    }

    doUnfollow()
  }

  const follow = () => {
    setIsLoading(true)
    userStore
      .followUser(followingProfile.userId)
      .then(({ status }) => {
        switch (status) {
          case "pending":
            setIsRequestSent(true)
            break
          case "success":
            setIsFollowingUser(true)
            break
          default:
            break
        }
      })
      .finally(() => setIsLoading(false))
  }

  const $container: ViewStyle = {
    paddingHorizontal: spacing.tiny,
    paddingVertical: spacing.small,
    justifyContent: "space-between",
  }

  // We must know if the user is private to properly handle the follow/unfollow button
  if (followingProfile?.privateAccount === undefined) return null

  return (
    <TouchableOpacity
      onPress={() =>
        mainNavigation.navigate("ProfileVisitorView", { userId: followingProfile.userId })
      }
    >
      <RowView style={$container}>
        <RowView style={styles.flex1}>
          <Avatar user={followingProfile} />
          <Spacer type="horizontal" size="small" />
          <View style={styles.flex1}>
            <Text weight="bold" numberOfLines={1} text={followingProfile.userHandle} />
            <Text
              numberOfLines={1}
              text={formatName(followingProfile.firstName, followingProfile.lastName)}
            />
          </View>
        </RowView>
        <View>
          {isRequestSent ? (
            <Button disabled={true} tx="userConnectionsScreen.following.pendingLabel" />
          ) : isFollowingUser ? (
            <Button
              isBusy={isLoading}
              tx="userConnectionsScreen.following.followingButtonLabel"
              onPress={unfollow}
            />
          ) : (
            <Button
              isBusy={isLoading}
              preset="reversed"
              tx="userConnectionsScreen.following.followButtonLabel"
              onPress={follow}
            />
          )}
        </View>
      </RowView>
    </TouchableOpacity>
  )
})

const FollowingTabScene = (props: { query: UseInfiniteQueryResult; following: IUserModel[] }) => {
  const { query, following } = props

  const $container: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  }

  if (query.isError) {
    return <Text tx="common.error.unknownErrorMessage" />
  }

  return (
    <View style={$container}>
      <FlatList
        data={following}
        renderItem={({ item }) => <FollowingTile {...item} />}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        refreshControl={
          <ThemedRefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
        }
      />
    </View>
  )
}

type UserConnectionsScreenProps = NativeStackScreenProps<MainStackParamList, "UserConnections">

export const UserConnectionsScreen = observer(
  ({ navigation, route }: UserConnectionsScreenProps) => {
    const { userId, userHandle } = route.params

    // hooks
    const { userStore, feedStore } = useStores()

    // states
    const [tabIndex, setTabIndex] = useState(0)

    // derived states
    const routes = [
      {
        key: "followers",
        title: `${translate("common.followers")} (${simplifyNumber(
          userStore.user?.followersCount ?? 0,
        )})`,
      },
      {
        key: "following",
        title: `${translate("common.following")} (${simplifyNumber(
          userStore.user?.followingCount ?? 0,
        )})`,
      },
    ]

    // prepare data here so it can be shared across tabs
    const followingQuery = useInfiniteQuery({
      queryKey: ["userConnections", "following", userId],
      queryFn: ({ pageParam }) => feedStore.getMoreUserFollowing(userId, pageParam),
      initialPageParam: null as unknown as FirebaseSnapshotType,
      getNextPageParam: (lastPage) => lastPage.lastDocSnapshot,
    })
    const followingProfiles = followingQuery.data?.pages?.flatMap((page) => page.userProfiles) ?? []

    const followersQuery = useInfiniteQuery({
      queryKey: ["userConnections", "followers", userId],
      queryFn: ({ pageParam }) => feedStore.getMoreUserFollowers(userId, pageParam),
      initialPageParam: null as unknown as FirebaseSnapshotType,
      getNextPageParam: (lastPage) => lastPage.lastDocSnapshot,
    })
    const followersProfiles =
      followersQuery.data?.pages
        ?.flatMap((page) => page.userProfiles)
        .map((user) => {
          return {
            ...user,
            isFollowingUser:
              followingProfiles?.some((followingUser) => followingUser.userId === user.userId) ??
              false,
          }
        }) ?? []

    useEffect(() => {
      navigation.setOptions({
        title: userHandle,
      })
    }, [])

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

    // Not using SceneMap because we should not pass inline functions
    // See: https://reactnavigation.org/docs/tab-view
    const renderScene = ({ route }) => {
      switch (route.key) {
        case "followers":
          return <FollowersTabScene query={followersQuery} followers={followersProfiles} />
        case "following":
          return <FollowingTabScene query={followingQuery} following={followingProfiles} />
        default:
          return null
      }
    }

    return (
      <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.flex1}>
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderTabBar={renderTabBar}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
        />
      </Screen>
    )
  },
)
