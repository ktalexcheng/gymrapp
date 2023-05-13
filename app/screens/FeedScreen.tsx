import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackScreenProps } from "app/navigators"
import { Text } from "app/components"
// import { useNavigation } from "@react-navigation/native"
// import { useStores } from "app/models"

interface FeedScreenProps extends NativeStackScreenProps<AppStackScreenProps<"Feed">> {}

export const FeedScreen: FC<FeedScreenProps> = observer(function FeedScreen() {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <View style={$container}>
      <Text text="feed" />
    </View>
  )
})

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}
