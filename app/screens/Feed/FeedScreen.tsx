import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Text } from "app/components"
import { TabScreenProps } from "app/navigators"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
// import { useNavigation } from "@react-navigation/native"
// import { useStores } from "app/models"

interface FeedScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const FeedScreen: FC<FeedScreenProps> = observer(function FeedScreen() {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <Text text="feed" />
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}
