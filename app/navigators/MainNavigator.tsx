import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { WorkoutSource } from "app/data/constants"
import { FollowRequest, Notification, User } from "app/data/model"
import {
  ActiveWorkoutScreen,
  CreateExerciseScreen,
  ExerciseDetailsScreen,
  ExerciseManagerScreen,
  ExercisePickerScreen,
  GymPickerScreen,
  LoadingScreen,
  NewWorkoutScreen,
  ProfileVisitorViewScreen,
  RestTimerScreen,
  SaveWorkoutScreen,
  UserSettingsScreen,
  WorkoutSummaryScreen,
} from "app/screens"
import { CreateNewGymScreen, GymDetailsScreen, GymSearchScreen } from "app/screens/Gym"
import { NotificationsScreen } from "app/screens/UserProfile/NotificationsScreen"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"
import { OnboardingNavigator } from "./OnboardingNavigator"
import { useMainNavigation } from "./navigationUtilities"

export type MainStackParamList = {
  Loading: undefined
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  SaveWorkout: undefined
  GymPicker: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseManager: undefined
  ExerciseDetails: { exerciseId: string }
  UserSettings: undefined
  Notifications: undefined
  WorkoutSummary: { workoutSource: WorkoutSource; workoutId: string; jumpToComments: boolean }
  OnboardingNavigator: undefined
  GymSearch: undefined
  CreateNewGym: { searchString: string }
  GymDetails: { gymId: string }
  ProfileVisitorView: { userId: string }
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
    if (!authStore.isAuthenticated) {
      console.debug("MainNavigator.useEffect [] authStore.isAuthenticated is false")
      return undefined
    }

    exerciseStore.getAllExercises()
    activityStore.getAllActivities()
    feedStore.refreshFeedItems()
    feedStore.loadUserWorkouts()

    // Listen to database update
    const userSubscriber = firestore()
      .collection("users")
      .doc(authStore.userId)
      .onSnapshot(
        (snapshot) => {
          console.debug("MainNavigator.userSubscriber.onSnapshot called")
          if (!snapshot.exists) return

          userStore.setUser(snapshot.data() as User)
        },
        (e) => console.error("MainNavigator.userSubscriber.onSnapshot error:", e),
      )

    const notificationsSubscriber = firestore()
      .collection(`notifications/${authStore.userId}/inbox`)
      .onSnapshot((snapshot) => {
        console.debug("MainNavigator.notificationsSubscriber.onSnapshot called")
        if (snapshot?.empty) {
          userStore.setNotifications(undefined)
        }

        const notifications = snapshot.docs.map((doc) => {
          console.debug("notificationsSubscriber data received:", doc.data())
          return { notificationId: doc.id, ...doc.data() }
        })
        userStore.setNotifications(notifications as Notification[])
      })

    const followRequestsSubscriber = firestore()
      .collection(`userFollows/${authStore.userId}/requests`)
      .onSnapshot((snapshot) => {
        console.debug("MainNavigator.followRequestsSubscriber.onSnapshot called")
        if (snapshot?.empty) {
          userStore.setFollowRequests(undefined)
        }

        const followRequests = snapshot.docs.map((doc) => {
          return { requestId: doc.id, ...doc.data() }
        })
        userStore.setFollowRequests(followRequests as FollowRequest[])
      })

    // Listen to database update
    // const exercisesSubscriber = firestore()
    //   .collection("exercises")
    //   .onSnapshot((snapshot) => {
    //     console.debug("MainNavigator.exercisesSubscriber.onSnapshot called")
    //     if (snapshot?.empty) return

    //     const exercises = snapshot.docs.map((doc) => {
    //       return { exerciseId: doc.id, ...doc.data() } as Exercise
    //     })
    //     exerciseStore.setAllExercises(exercises)
    //   })

    return () => {
      userSubscriber()
      // exercisesSubscriber()
      notificationsSubscriber()
      followRequestsSubscriber()
    }
  }, [])

  useEffect(() => {
    if (userStore.isLoadingProfile) {
      console.debug("Profile is loading, not navigating")
      return
    }

    if (userStore.profileIncomplete) {
      console.debug("Profile is incomplete, navigating to OnboardingNavigator")
      // Always navigate to "OnboardingNavigator" if profile is incomplete
      mainNavigation.reset({
        index: 0,
        routes: [{ name: "OnboardingNavigator" }],
      })
    } else {
      // Check if navigator is on route "OnboardingNavigator", if so, navigate to "HomeTabNavigator"
      // The root navigator is MainNavigator, so we need to get the state of routes[0]
      const navigationState = mainNavigation.getState()
      const mainNavigatorState = navigationState.routes[0].state
      const isOnLoading = mainNavigatorState?.routes.find((r) => r.name === "Loading")
      // If profile is complete and there is nothing in the navigator stack or the navigator is on "Loading"
      // (i.e. the user has just logged in), navigate to "HomeTabNavigator"
      if (!mainNavigatorState || isOnLoading) {
        console.debug("Profile is complete, navigating to HomeTabNavigator")
        mainNavigation.reset({
          index: 0,
          routes: [{ name: "HomeTabNavigator" }],
        })
      }
    }
  }, [userStore.isLoadingProfile, userStore.profileIncomplete])

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={"Loading"}>
      <MainStack.Screen name="Loading" component={LoadingScreen} />
      <MainStack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />
      <MainStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />

      <MainStack.Group>
        <MainStack.Screen name="NewWorkout" component={NewWorkoutScreen} />
        <MainStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <MainStack.Screen name="SaveWorkout" component={SaveWorkoutScreen} />
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
        <MainStack.Screen
          name="WorkoutSummary"
          options={{ headerShown: true }}
          component={WorkoutSummaryScreen}
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
        options={{ headerShown: false, gestureEnabled: false }}
        component={UserSettingsScreen}
      />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="ProfileVisitorView" component={ProfileVisitorViewScreen} />
    </MainStack.Navigator>
  )
})
