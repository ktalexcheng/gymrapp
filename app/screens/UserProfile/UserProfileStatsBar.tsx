import { RowView, Spacer, Text } from "app/components"
import { User } from "app/data/model"
import { TxKeyPath } from "app/i18n"
import { simplifyNumber } from "app/utils/formatNumber"
import React, { FC } from "react"
import { View, ViewStyle } from "react-native"

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
  user: User
  containerStyle?: ViewStyle
}

export const UserProfileStatsBar: FC<UserProfileStatsBarProps> = ({
  user,
  containerStyle: $containerStyleOverride,
}: UserProfileStatsBarProps) => {
  const $containerStyle = [$userStatsRow, $containerStyleOverride]

  const activitiesCount = (user?.workoutMetas && Object.keys(user.workoutMetas).length) ?? 0
  const followersCount = user?.followersCount ?? 0
  const followingCount = user?.followingCount ?? 0

  return (
    <RowView style={$containerStyle}>
      <UserProfileStatTile labelTx="common.activities" value={simplifyNumber(activitiesCount)} />
      <UserProfileStatTile labelTx="common.followers" value={simplifyNumber(followersCount)} />
      <UserProfileStatTile labelTx="common.following" value={simplifyNumber(followingCount)} />
    </RowView>
  )
}

const $userProfileStatTile: ViewStyle = {
  alignItems: "center",
}

const $userStatsRow: ViewStyle = {
  justifyContent: "space-between",
}
