import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import React from "react"
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
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={"HomeTabNavigator"}
    >
      <RootStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />
      <RootStack.Screen name="ActivityNavigator" component={ActivityNavigator} />
    </RootStack.Navigator>
  )
}
