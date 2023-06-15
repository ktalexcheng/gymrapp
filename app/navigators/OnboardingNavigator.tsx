import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { NewUserProfileScreen } from "app/screens"
import React from "react"

export type OnboardingStackParamList = {
  NewUserProfile: undefined
}

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()

export const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator initialRouteName="NewUserProfile">
      <OnboardingStack.Screen name="NewUserProfile" component={NewUserProfileScreen} />
    </OnboardingStack.Navigator>
  )
}
