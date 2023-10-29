import { RowView, Spacer, Text } from "app/components"
import { User } from "app/data/model"
import { TxKeyPath } from "app/i18n"
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

  return (
    <RowView style={$containerStyle}>
      <UserProfileStatTile
        labelTx="common.activities"
        value={(user?.workoutMetas && Object.keys(user.workoutMetas).length.toString()) ?? "0"}
      />
      <UserProfileStatTile
        labelTx="common.followers"
        value={user?.followersCount?.toString() ?? "0"}
      />
      <UserProfileStatTile
        labelTx="common.following"
        value={user?.followingCount?.toString() ?? "0"}
      />
    </RowView>
  )
}

const $userProfileStatTile: ViewStyle = {
  alignItems: "center",
}

const $userStatsRow: ViewStyle = {
  justifyContent: "space-between",
}
