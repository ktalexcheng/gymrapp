import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Screen } from "app/components"
import { TabScreenProps } from "app/navigators"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
// import { useNavigation } from "@react-navigation/native"
import { useStores } from "app/models"
import { spacing } from "../theme"

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()
  const {
    authenticationStore: { logout },
  } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen style={$screenContentContainer}>
      <Button onPress={logout}>Logout</Button>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}
