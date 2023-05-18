import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActiveWorkoutScreen, ExercisePickerScreen, NewWorkoutScreen } from "app/screens"
import React from "react"

export type ActivityStackParamList = {
  NewWorkout: undefined
  ActiveWorkout: undefined
  ExercisePicker: undefined
}

export type ActivityStackScreenProps<T extends keyof ActivityStackParamList> =
  NativeStackScreenProps<ActivityStackParamList, T>

const Stack = createNativeStackNavigator<ActivityStackParamList>()

export const ActivityNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="NewWorkout">
      <Stack.Screen name="NewWorkout" component={NewWorkoutScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
    </Stack.Navigator>
  )
}
