import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Icon, RowView, Screen, Text } from "app/components"
import { TabScreenProps, useMainNavigation } from "app/navigators"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { Image, ImageStyle, ViewStyle } from "react-native"
// import { useNavigation } from "@react-navigation/native"
import { useStores } from "app/stores"
import { colors, spacing } from "../theme"

const tempUserAvatar = require("../../assets/images/app-icon-all.png")

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const { userStore } = useStores()
  const [isLoading, setIsLoading] = useState(true)
  const mainNavigation = useMainNavigation()

  useEffect(() => {
    setIsLoading(userStore.isLoading)
  }, [userStore.isLoading])

  return isLoading ? (
    <Text>Loading</Text>
  ) : (
    <Screen safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      <RowView style={$userSettingsIcon}>
        <RowView style={$headerRow}>
          <Image source={tempUserAvatar} style={$userAvatar} />
          <Text style={$userDisplayName}>{userStore.displayName}</Text>
        </RowView>
        <Icon
          name="settings-outline"
          onPress={() => mainNavigation.navigate("UserSettings")}
          color={colors.actionable}
          size={32}
        />
      </RowView>

      <Text preset="subheading" tx="profileScreen.userActivities" />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}

const $userSettingsIcon: ViewStyle = {
  justifyContent: "space-between",
  marginBottom: spacing.large,
}

const $headerRow: ViewStyle = {
  alignItems: "center",
}

const $userAvatar: ImageStyle = {
  height: 30,
  width: 30,
  borderRadius: 30,
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}
