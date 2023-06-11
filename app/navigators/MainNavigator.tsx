import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { User } from "app/data/model"
import {
  ActiveWorkoutScreen,
  CreateExerciseScreen,
  ExerciseManagerScreen,
  ExercisePickerScreen,
  NewWorkoutScreen,
  RestTimerScreen,
  UserSettingsScreen,
} from "app/screens"
import { useStores } from "app/stores"
import React, { useEffect } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"

export type MainStackParamList = {
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseManager: undefined
  UserSettings: undefined
}

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>

const MainStack = createNativeStackNavigator<MainStackParamList>()

export function MainNavigator() {
  const { authenticationStore: authStore, userStore } = useStores()

  // Listen to database update
  useEffect(() => {
    const userSubscriber = firestore()
      .collection("users")
      .doc(authStore.firebaseUser.uid)
      .onSnapshot((snapshot) => {
        userStore.setProp("user", snapshot.data() as User)
        // Workout metadata is written to the 'users' collection document
        // so it will trigger an event when a new workout is saved
        userStore.getWorkouts()
      }, console.error)

    return () => {
      userSubscriber()
    }
  }, [])

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
      <MainStack.Screen
        name="UserSettings"
        options={{ headerShown: true }}
        component={UserSettingsScreen}
      />
    </MainStack.Navigator>
  )
}
