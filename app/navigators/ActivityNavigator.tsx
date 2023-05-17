import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActiveWorkoutScreen, NewWorkoutScreen } from "app/screens"
import React from "react"

export type ActivityStackParamList = {
  NewWorkout: undefined
  ActiveWorkout: undefined
}

export type ActivityStackScreenProps<T extends keyof ActivityStackParamList> =
  NativeStackScreenProps<ActivityStackParamList, T>

const Stack = createNativeStackNavigator<ActivityStackParamList>()

export const ActivityNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="NewWorkout">
      <Stack.Screen name="NewWorkout" component={NewWorkoutScreen} />
      <Stack.Screen
        options={{ headerShown: false }}
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
      />
    </Stack.Navigator>
  )
}
