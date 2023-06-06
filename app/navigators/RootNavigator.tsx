import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { spacing } from "app/theme"
import React from "react"
import { Text, View, ViewStyle } from "react-native"
import { ActivityNavigator } from "./ActivityNavigator"
import { HomeTabNavigator } from "./HomeTabNavigator"

export type RootStackParamList = {
  HomeTabNavigator: undefined
  ActivityNavigator: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

const RootStack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  return (
    <>
      <View style={$activeActivityOverlay}>
        <Text>Test</Text>
      </View>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={"HomeTabNavigator"}
      >
        <RootStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />
        <RootStack.Screen name="ActivityNavigator" component={ActivityNavigator} />
      </RootStack.Navigator>
    </>
  )
}

const $activeActivityOverlay: ViewStyle = {
  position: "absolute",
  zIndex: 1,
  bottom: spacing.huge,
  right: spacing.screen,
}
