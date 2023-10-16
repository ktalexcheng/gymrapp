import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { WorkoutSource } from "app/data/constants"
import { Exercise, User } from "app/data/model"
import {
  ActiveWorkoutScreen,
  CreateExerciseScreen,
  ExerciseDetailsScreen,
  ExerciseManagerScreen,
  ExercisePickerScreen,
  GymPickerScreen,
  NewWorkoutScreen,
  RestTimerScreen,
  UserSettingsScreen,
  WorkoutSummaryScreen,
} from "app/screens"
import { CreateNewGymScreen, GymDetailsScreen, GymSearchScreen } from "app/screens/Gym"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"
import { OnboardingNavigator } from "./OnboardingNavigator"
import { useMainNavigation } from "./navigationUtilities"

export type MainStackParamList = {
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  GymPicker: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseManager: undefined
  ExerciseDetails: { exerciseId: string }
  UserSettings: undefined
  WorkoutSummary: { workoutId: string; workoutSource: WorkoutSource }
  OnboardingNavigator: undefined
  GymSearch: undefined
  CreateNewGym: { searchString: string }
  GymDetails: { gymId: string }
}

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>

const MainStack = createNativeStackNavigator<MainStackParamList>()

export const MainNavigator = observer(function MainNavigator() {
  const {
    authenticationStore: authStore,
    userStore,
    activityStore,
    exerciseStore,
    feedStore,
  } = useStores()
  const mainNavigation = useMainNavigation()

  useEffect(() => {
    console.debug("MainNavigator.useEffect [] called")
    exerciseStore.getAllExercises()
    activityStore.getAllActivities()
    feedStore.refreshFeedItems()

    // Listen to database update
    const userSubscriber = firestore()
      .collection("usersPrivate")
      .doc(authStore.userId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) return

          userStore.setUser(snapshot.data() as User)
        },
        (e) => console.error("MainNavigator.userSubscriber.onSnapshot error:", e),
      )

    // Listen to database update
    const exercisesSubscriber = firestore()
      .collection("exercises")
      .onSnapshot((snapshot) => {
        if (snapshot.empty) return

        const exercises = snapshot.docs.map((doc) => {
          return { exerciseId: doc.id, ...doc.data() } as Exercise
        })
        exerciseStore.setAllExercises(exercises)
      })

    return () => {
      userSubscriber()
      exercisesSubscriber()
    }
  }, [])

  useEffect(() => {
    console.debug("HomeTabNavigator.useEffect [userStore.profileIncomplete] called")
    if (userStore.profileIncomplete) {
      console.debug("Profile is incomplete, navigating to OnboardingNavigator")
      mainNavigation.navigate("OnboardingNavigator")
    }
  }, [userStore.profileIncomplete])

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
        <MainStack.Screen name="GymPicker" component={GymPickerScreen} />
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

      <MainStack.Group>
        <MainStack.Screen
          name="GymSearch"
          options={{ headerShown: true }}
          component={GymSearchScreen}
        />
        <MainStack.Screen
          name="CreateNewGym"
          options={{ headerShown: true }}
          component={CreateNewGymScreen}
        />
        <MainStack.Screen
          name="GymDetails"
          options={{ headerShown: true }}
          component={GymDetailsScreen}
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
