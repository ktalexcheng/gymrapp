import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import {
  ActiveWorkoutScreen,
  AddExerciseScreen,
  ExercisePickerScreen,
  NewWorkoutScreen,
} from "app/screens"
import React from "react"

export type ActivityStackParamList = {
  NewWorkout: undefined
  ActiveWorkout: undefined
  ExercisePicker: undefined
  AddExercise: undefined
}

export type ActivityStackScreenProps<T extends keyof ActivityStackParamList> =
  NativeStackScreenProps<ActivityStackParamList, T>

const Stack = createNativeStackNavigator<ActivityStackParamList>()

export const ActivityNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="NewWorkout">
      <Stack.Screen name="NewWorkout" component={NewWorkoutScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen
        name="ExercisePicker"
        options={{ headerShown: true }}
        component={ExercisePickerScreen}
      />
      <Stack.Screen
        name="AddExercise"
        options={{ headerShown: true }}
        component={AddExerciseScreen}
      />
    </Stack.Navigator>
  )
}
