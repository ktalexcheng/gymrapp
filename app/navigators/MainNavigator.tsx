import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import {
  ActiveWorkoutScreen,
  CreateExerciseScreen,
  ExerciseManagerScreen,
  ExercisePickerScreen,
  NewWorkoutScreen,
  RestTimerScreen,
} from "app/screens"
import React from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"

export type MainStackParamList = {
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseManager: undefined
}

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>

const MainStack = createNativeStackNavigator<MainStackParamList>()

export function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={"HomeTabNavigator"}
    >
      <MainStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />

      <MainStack.Group>
        <MainStack.Screen name="NewWorkout" component={NewWorkoutScreen} />
        <MainStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <MainStack.Screen
          name="ExercisePicker"
          options={{ headerShown: true }}
          component={ExercisePickerScreen}
        />
        <MainStack.Screen
          name="CreateExercise"
          options={{ headerShown: true }}
          component={CreateExerciseScreen}
        />
        <MainStack.Screen
          name="RestTimer"
          options={{ headerShown: true }}
          component={RestTimerScreen}
        />
      </MainStack.Group>

      <MainStack.Screen
        name="ExerciseManager"
        options={{ headerShown: true }}
        component={ExerciseManagerScreen}
      />
    </MainStack.Navigator>
  )
}
