import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { Exercise, User } from "app/data/model"
import {
  ActiveWorkoutScreen,
  CreateExerciseScreen,
  ExerciseDetailsScreen,
  ExerciseManagerScreen,
  ExercisePickerScreen,
  NewWorkoutScreen,
  RestTimerScreen,
  UserSettingsScreen,
  WorkoutSummaryScreen,
} from "app/screens"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"
import { OnboardingNavigator } from "./OnboardingNavigator"

export type MainStackParamList = {
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseManager: undefined
  ExerciseDetails: { exerciseId: string }
  UserSettings: undefined
  WorkoutSummary: { workoutId: string }
  OnboardingNavigator: undefined
}

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>

const MainStack = createNativeStackNavigator<MainStackParamList>()

export const MainNavigator = observer(function MainNavigator() {
  const { authenticationStore: authStore, userStore, exerciseStore } = useStores()

  // Listen to database update
  useEffect(() => {
    console.debug("MainNavigator.useEffect() triggered")
    userStore.loadUserWithId(authStore.firebaseUser.uid)
    exerciseStore.getAllExercises()

    const userSubscriber = firestore()
      .collection("users")
      .doc(authStore.firebaseUser.uid)
      .onSnapshot((snapshot) => {
        if (!snapshot.exists) return

        userStore.updateProfile(snapshot.data() as User)
      }, console.error)

    const exercisesSubscriber = firestore()
      .collection("exercises")
      .onSnapshot((snapshot) => {
        if (snapshot.empty) return

        const exercises = snapshot.docs.map((doc) => {
          return { exerciseId: doc.id, exerciseSource: "Public", ...doc.data() } as Exercise
        })
        exerciseStore.setAllExercises(exercises)
      })

    return () => {
      userSubscriber()
      exercisesSubscriber()
    }
  }, [])

  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={"HomeTabNavigator"}
    >
      <MainStack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />

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

      <MainStack.Group>
        <MainStack.Screen
          name="ExerciseManager"
          options={{ headerShown: true }}
          component={ExerciseManagerScreen}
        />
        <MainStack.Screen
          name="ExerciseDetails"
          options={{ headerShown: true }}
          component={ExerciseDetailsScreen}
        />
      </MainStack.Group>

      <MainStack.Screen
        name="UserSettings"
        options={{ headerShown: true }}
        component={UserSettingsScreen}
      />
      <MainStack.Screen
        name="WorkoutSummary"
        options={{ headerShown: true }}
        component={WorkoutSummaryScreen}
      />
    </MainStack.Navigator>
  )
})
