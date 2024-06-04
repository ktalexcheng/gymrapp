import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { CreateProfileScreen, OnboardingSuccessScreen } from "app/features/Onboarding"
import React from "react"

export type OnboardingStackParamList = {
  CreateProfile: undefined
  OnboardingSuccess: undefined
}

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()

export const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator
      initialRouteName="CreateProfile"
      screenOptions={{ headerShown: false, headerBackButtonMenuEnabled: false }}
    >
      <OnboardingStack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <OnboardingStack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
    </OnboardingStack.Navigator>
  )
}
