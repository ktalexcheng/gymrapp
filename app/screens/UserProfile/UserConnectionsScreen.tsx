import { NativeStackScreenProps } from "@react-navigation/native-stack"
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

type ConnectionsTabSceneProps = {
  userId: string
}

const FollowerTile = observer((followerProfile: IUserModel) => {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()

  const [isFollowingUser, setIsFollowingUser] = useState<boolean>()
  const [isFollowerRemoved, setIsFollowerRemoved] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    userStore.isFollowingUser(followerProfile.userId).then(setIsFollowingUser)
  }, [])

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

const FollowersTabScene = ({ userId }: ConnectionsTabSceneProps) => {
  const { feedStore } = useStores()

  const [followerProfiles, setFollowerProfiles] = useState<IUserModel>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadMore()
  }, [])

  const loadMore = (refresh?: boolean) => {
    if (loading) return

    if (refresh) {
      setFollowerProfiles([])
      setHasMore(true)
    }

    if (refresh || hasMore) {
      setLoading(true)
      feedStore
        .getMoreUserFollowers(userId, refresh)
        .then((result) => {
          setFollowerProfiles((prev) => [...prev, ...result.userProfiles])
          setHasMore(result.hasMore)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }

  const $container: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  }

  console.debug("followerProfiles length", followerProfiles.length)

  if (error) {
    return <Text tx="common.error.unknownErrorMessage" />
  }

  return (
    <View style={$container}>
      <FlatList
        data={followerProfiles}
        renderItem={({ item }) => <FollowerTile {...item} />}
        onEndReached={() => loadMore(false)}
        refreshControl={
          <ThemedRefreshControl refreshing={loading} onRefresh={() => loadMore(true)} />
        }
      />
    </View>
  )
}

const FollowingTile = observer((followingProfile: IUserModel) => {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()

  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true)
  const [isRequestSent, setIsRequestSent] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {}, [])

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
            text: translate("userConnectionsScreen.following.unfollowButtonLabel"),
            style: "destructive",
            onPress: doUnfollow,
          },
          {
            text: translate("common.cancel"),
            style: "cancel",
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
      .then(({ status, requestId }) => {
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

const FollowingTabScene = ({ userId }: ConnectionsTabSceneProps) => {
  const { feedStore } = useStores()

  const [followingProfiles, setFollowingProfiles] = useState<IUserModel>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadMore()
  }, [])

  const loadMore = (refresh?: boolean) => {
    if (loading) return

    if (refresh) {
      setFollowingProfiles([])
      setHasMore(true)
    }

    if (refresh || hasMore) {
      setLoading(true)
      feedStore
        .getMoreUserFollowing(userId, refresh)
        .then((result) => {
          setFollowingProfiles((prev) => [...prev, ...result.userProfiles])
          setHasMore(result.hasMore)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }

  const $container: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  }

  console.debug("followingProfiles length", followingProfiles.length)

  if (error) {
    return <Text tx="common.error.unknownErrorMessage" />
  }

  return (
    <View style={$container}>
      <FlatList
        data={followingProfiles}
        renderItem={({ item }) => <FollowingTile {...item} />}
        onEndReached={() => loadMore(false)}
        refreshControl={
          <ThemedRefreshControl refreshing={loading} onRefresh={() => loadMore(true)} />
        }
      />
    </View>
  )
}

type UserConnectionsScreenProps = NativeStackScreenProps<MainStackParamList, "UserConnections">

export const UserConnectionsScreen = observer(
  ({ navigation, route }: UserConnectionsScreenProps) => {
    const { userId, userHandle } = route.params

    useEffect(() => {
      navigation.setOptions({
        title: userHandle,
      })
    }, [])

    const { userStore } = useStores()

    const [tabIndex, setTabIndex] = useState(0)

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

    const renderTabBar = (props) => {
      return <TabBar tabIndex={tabIndex} setTabIndex={setTabIndex} {...props} />
    }

    // Not using SceneMap because we should not pass inline functions
    // See: https://reactnavigation.org/docs/tab-view
    const renderScene = ({ route }) => {
      switch (route.key) {
        case "followers":
          return <FollowersTabScene userId={userId} />
        case "following":
          return <FollowingTabScene userId={userId} />
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
