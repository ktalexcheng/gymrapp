import { RowView, Spacer, Text } from "app/components"
import { TxKeyPath } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IUserModel } from "app/stores"
import { simplifyNumber } from "app/utils/formatNumber"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewProps, ViewStyle } from "react-native"

const UserProfileStatTile: FC<{ labelTx: TxKeyPath; value: string }> = ({ labelTx, value }) => {
  return (
    <View style={$userProfileStatTile}>
      <Text preset="subheading">{value}</Text>
      <Spacer type="horizontal" size="small" />
      <Text preset="formLabel" tx={labelTx} />
    </View>
  )
}

interface UserProfileStatsBarProps {
  user: IUserModel
  containerStyle?: ViewStyle
  hideActivitesCount?: boolean
  onLayout?: ViewProps["onLayout"]
}

export const UserProfileStatsBar: FC<UserProfileStatsBarProps> = ({
  user,
  containerStyle: $containerStyleOverride,
  hideActivitesCount = false,
  onLayout,
}: UserProfileStatsBarProps) => {
  const mainNavigation = useMainNavigation()

  const $containerStyle = [$userStatsRow, $containerStyleOverride]

  // user.workoutMetas could be a MST model or a plain object
  // the isMapType() method from mobx-state-tree does not work properly
  // so we have to use a try/catch block to handle both cases
  let activitiesCount = 0
  if (!hideActivitesCount && user?.workoutMetas) {
    try {
      activitiesCount = Array.from(user.workoutMetas.values()).length
    } catch {
      activitiesCount = Object.keys(user.workoutMetas).length
    }
  }
  const followersCount = user?.followersCount ?? 0
  const followingCount = user?.followingCount ?? 0

  console.debug("UserProfileStatsBar", { activitiesCount, followersCount, followingCount })

  return (
    <RowView style={$containerStyle} onLayout={onLayout}>
      <UserProfileStatTile labelTx="common.activities" value={simplifyNumber(activitiesCount)!} />
      <TouchableOpacity
        onPress={() =>
          mainNavigation.navigate("UserConnections", {
            userId: user.userId,
            userHandle: user.userHandle,
          })
        }
      >
        <UserProfileStatTile labelTx="common.followers" value={simplifyNumber(followersCount)!} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          mainNavigation.navigate("UserConnections", {
            userId: user.userId,
            userHandle: user.userHandle,
          })
        }
      >
        <UserProfileStatTile labelTx="common.following" value={simplifyNumber(followingCount)!} />
      </TouchableOpacity>
    </RowView>
  )
}

const $userProfileStatTile: ViewStyle = {
  alignItems: "center",
}

const $userStatsRow: ViewStyle = {
  justifyContent: "space-between",
}
