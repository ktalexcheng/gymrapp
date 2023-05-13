import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { SignInScreen, SignUpScreen } from "app/screens"
import React from "react"

export type AuthStackParamList = {
  SignIn: undefined
  SignUp: undefined
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SignIn">
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  )
}
