import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { WorkoutSource } from "app/data/constants"
import { FollowRequest, User } from "app/data/types"
import { translate } from "app/i18n"
import {
  ActiveWorkoutScreen,
  AddToMyGymsScreen,
  CreateExerciseScreen,
  CreateNewGymScreen,
  ExerciseDetailsScreen,
  ExercisePickerScreen,
  GymDetailsScreen,
  LoadingScreen,
  NotificationsScreen,
  ProfileVisitorViewScreen,
  RestTimerScreen,
  SaveWorkoutScreen,
  UserSettingsScreen,
  WorkoutGymPickerScreen,
  WorkoutSummaryScreen,
} from "app/screens"
import { INotificationModel, useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"
import { OnboardingNavigator } from "./OnboardingNavigator"
import { useMainNavigation } from "./navigationUtilities"

export type MainStackParamList = {
  Loading: undefined
  HomeTabNavigator: undefined
  NewWorkout: undefined
  ActiveWorkout: undefined
  SaveWorkout: undefined
  WorkoutGymPicker: undefined
  ExercisePicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  // ExerciseManager: undefined
  ExerciseDetails: { exerciseId: string }
  UserSettings: undefined
  Notifications: undefined
  WorkoutSummary: {
    workoutSource: WorkoutSource
    workoutId: string
    workoutByUserId: string
    jumpToComments: boolean
  }
  OnboardingNavigator: undefined
  AddToMyGyms: undefined
  CreateNewGym: { searchString?: string }
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
  const [isInitialized, setIsInitialized] = useState(false)

  const listenToSnapshots = () => {
    if (!authStore.userId) return

    // Listen to database update
    const userSubscriber = firestore()
      .collection("users")
      .doc(authStore.userId)
      .onSnapshot(
        (snapshot) => {
          console.debug("MainNavigator.userSubscriber.onSnapshot called")
          if (!snapshot.exists) return

          userStore.setUserFromFirebase(snapshot.data() as User)
          feedStore.loadUserWorkouts()
        },
        (e) => console.error("MainNavigator.userSubscriber.onSnapshot error:", e),
      )

    // TODO: Should only process the documents that changed, not the entire collection
    // leverage snapshot.docChanges() to get the changes
    const notificationsSubscriber = firestore()
      .collection(`notifications/${authStore.userId}/inbox`)
      .onSnapshot((snapshot) => {
        console.debug("MainNavigator.notificationsSubscriber.onSnapshot called")
        if (snapshot?.empty) {
          userStore.setNotifications([])
        }

        const notifications = snapshot.docs.map((doc) => {
          return { notificationId: doc.id, ...doc.data() }
        })
        userStore.setNotifications(notifications as INotificationModel[])
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

    return () => {
      console.debug("MainNavigator.listenToSnapshots cleanup called")
      userSubscriber()
      notificationsSubscriber()
      followRequestsSubscriber()
    }
  }

  const navigateToHomeIfNeeded = () => {
    // The root navigator is MainNavigator, so we need to get the state of routes[0]
    // If profile is complete and there is nothing in the navigator stack (i.e. MainNavigator not yet initialized to initialRouteName)
    // or the navigator is on "Loading" (i.e. the user has just logged in),
    // then we navigate to "HomeTabNavigator"
    const navigationState = mainNavigation.getState()
    const mainNavigatorState = navigationState.routes[0].state // Undefined if MainNavigator not yet initialized
    const currentScreenName =
      mainNavigatorState?.index && mainNavigatorState.routes[mainNavigatorState.index].name
    const isOnboarding = currentScreenName === "OnboardingNavigator"
    const isOnLoading = currentScreenName === "Loading"
    console.debug("MainNavigator navigateToHome: checking if we need to exit onboarding", {
      navigationState,
      mainNavigatorState,
      currentScreenName,
      isOnboarding,
      isOnLoading,
    })

    if (!currentScreenName || isOnboarding || isOnLoading) {
      console.debug(
        "MainNavigator navigateToHome: Profile is complete, navigating to HomeTabNavigator",
      )
      mainNavigation.reset({
        index: 0,
        routes: [{ name: "HomeTabNavigator" }],
      })
    }
  }

  // Handle forced navigation to onboarding procedure if profile is incomplete
  useEffect(() => {
    // console.debug("MainNavigator.useEffect called", {
    //   isAuthenticated: authStore.isAuthenticated,
    //   profileIncomplete: userStore.profileIncomplete,
    //   isInitialized,
    // })
    if (!authStore.isAuthenticated) {
      console.debug("MainNavigator.useEffect: User is not authenticated, nothing is done")
      return undefined
    }

    // If something goes wrong or we add a new field to the user profile, we can force the user to complete the profile again
    if (userStore.profileIncomplete) {
      console.debug("MainNavigator.useEffect: navigating to OnboardingNavigator")
      // Always navigate to "OnboardingNavigator" if profile is incomplete
      mainNavigation.reset({
        index: 0,
        routes: [{ name: "OnboardingNavigator" }],
      })
      return undefined
    }

    // If user is authenticated and profile is complete, then we can initialize the app
    // but this should only be done once
    if (!isInitialized && authStore.userId) {
      exerciseStore.getAllExercises().then(() => {
        if (userStore.user) exerciseStore.applyUserSettings(userStore.user)
      })
      activityStore.getAllActivities()
      feedStore.setUserId(authStore.userId)
      feedStore.refreshFeedItems()
      feedStore.loadUserWorkouts()

      // If navigation is stuck at "Loading", or user just completed onboarding, or the stack is empty, then navigate to "HomeTabNavigator"
      navigateToHomeIfNeeded()

      setIsInitialized(true)
    }

    const unsubscribe = listenToSnapshots()
    return unsubscribe
  }, [mainNavigation, authStore.isAuthenticated, userStore.profileIncomplete])

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={"Loading"}>
      <MainStack.Screen name="Loading" component={LoadingScreen} />
      <MainStack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />
      <MainStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />

      <MainStack.Group>
        <MainStack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{
            animation: "slide_from_bottom",
          }}
        />
        <MainStack.Screen name="SaveWorkout" component={SaveWorkoutScreen} />
        <MainStack.Screen name="WorkoutGymPicker" component={WorkoutGymPickerScreen} />
        <MainStack.Screen
          name="ExercisePicker"
          options={{ headerShown: true, title: translate("exercisePickerScreen.headerTitle") }}
          component={ExercisePickerScreen}
        />
        <MainStack.Screen name="CreateExercise" component={CreateExerciseScreen} />
        <MainStack.Screen
          name="RestTimer"
          options={{ headerShown: true, title: translate("restTimerScreen.headerTitle") }}
          component={RestTimerScreen}
        />
      </MainStack.Group>

      <MainStack.Group>
        {/* <MainStack.Screen
          name="ExerciseManager"
          component={ExerciseManagerScreen}
        /> */}
        <MainStack.Screen
          name="ExerciseDetails"
          options={{ headerShown: true, title: translate("exerciseDetailsScreen.headerTitle") }}
          component={ExerciseDetailsScreen}
        />
        <MainStack.Screen
          name="WorkoutSummary"
          component={WorkoutSummaryScreen}
          options={{ headerShown: true, title: translate("workoutSummaryScreen.headerTitle") }}
        />
      </MainStack.Group>

      <MainStack.Group>
        <MainStack.Screen name="AddToMyGyms" component={AddToMyGymsScreen} />
        <MainStack.Screen name="CreateNewGym" component={CreateNewGymScreen} />
        <MainStack.Screen
          name="GymDetails"
          options={{ headerShown: true, title: translate("gymDetailsScreen.headerTitle") }}
          component={GymDetailsScreen}
        />
      </MainStack.Group>

      <MainStack.Screen
        name="UserSettings"
        options={{ gestureEnabled: false }}
        component={UserSettingsScreen}
      />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="ProfileVisitorView" component={ProfileVisitorViewScreen} />
    </MainStack.Navigator>
  )
})
