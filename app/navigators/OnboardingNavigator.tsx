import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { CreateProfileScreen } from "app/screens"
import React from "react"

export type OnboardingStackParamList = {
  CreateProfile: undefined
}

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()

export const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator
      initialRouteName="CreateProfile"
      screenOptions={{ headerShown: false }}
    >
      <OnboardingStack.Screen name="CreateProfile" component={CreateProfileScreen} />
    </OnboardingStack.Navigator>
  )
}
