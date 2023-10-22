import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Button, RowView, Screen, Spacer, Text } from "app/components"
import { User } from "app/data/model"
import { TxKeyPath } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { RefreshControl, View, ViewStyle } from "react-native"
import { LoadingScreen } from "../LoadingScreen"

const UserStatTile: FC<{ labelTx: TxKeyPath; value: string }> = ({ labelTx, value }) => {
  return (
    <View style={$userStatTile}>
      <Text preset="subheading">{value}</Text>
      <Spacer type="horizontal" size="small" />
      <Text preset="formLabel" tx={labelTx} />
    </View>
  )
}

interface ProfileVisitorViewScreenProps
  extends NativeStackScreenProps<MainStackParamList, "ProfileVisitorView"> {}

export const ProfileVisitorViewScreen: FC<ProfileVisitorViewScreenProps> = observer(
  ({ route }: ProfileVisitorViewScreenProps) => {
    const foreignUserId = route.params.userId
    const { userStore } = useStores()
    const [foreignUser, setForeignUser] = useState<User>(undefined)
    const [isFollowing, setIsFollowing] = useState<boolean>(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
      const refresh = async () => {
        setIsRefreshing(true)
        await userStore.getForeignUser(foreignUserId).then((user) => setForeignUser(user))
        await userStore
          .isFollowingUser(foreignUserId)
          .then((isFollowing) => setIsFollowing(isFollowing))
        setIsRefreshing(false)
      }

      refresh()
    }, [userStore.user, refreshKey])

    const renderUserProfile = () => {
      if (!foreignUser) {
        return <LoadingScreen />
      }

      return (
        <>
          <RowView>
            <Avatar user={foreignUser} size="lg" />
            <Spacer type="horizontal" size="medium" />
            <View>
              <Text preset="heading">{`${foreignUser.firstName} ${foreignUser.lastName}`}</Text>
              <RowView>
                <Text preset="formLabel" tx="profileVisitorViewScreen.dateJoinedLabel" />
                <Spacer type="horizontal" size="small" />
                <Text preset="formLabel">{foreignUser._createdAt.toLocaleString()}</Text>
              </RowView>
            </View>
          </RowView>
          <RowView style={$userStatsRow}>
            <UserStatTile
              labelTx="common.activities"
              value={
                (foreignUser?.workoutMetas &&
                  Object.keys(foreignUser.workoutMetas).length.toString()) ??
                "0"
              }
            />
            <UserStatTile
              labelTx="common.followers"
              value={foreignUser?.followersCount?.toString() ?? "0"}
            />
            <UserStatTile
              labelTx="common.following"
              value={foreignUser?.followingCount?.toString() ?? "0"}
            />
          </RowView>
          {isFollowing ? (
            <Button
              tx="profileVisitorViewScreen.unfollowButtonLabel"
              onPress={() => userStore.unfollowUser(foreignUserId)}
            />
          ) : (
            <Button
              tx="profileVisitorViewScreen.followButtonLabel"
              onPress={() => userStore.followUser(foreignUserId)}
            />
          )}
        </>
      )
    }

    return (
      <Screen
        safeAreaEdges={["top", "bottom"]}
        style={styles.screenContainer}
        preset="scroll"
        ScrollViewProps={{
          refreshControl: (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => setRefreshKey((prev) => prev + 1)}
            />
          ),
        }}
      >
        {renderUserProfile()}
      </Screen>
    )
  },
)

const $userStatsRow: ViewStyle = {
  justifyContent: "space-between",
}

const $userStatTile: ViewStyle = {
  alignItems: "center",
  marginVertical: spacing.medium,
}
