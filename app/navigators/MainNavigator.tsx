import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { FollowRequest, User } from "app/data/types"
import { CreateExerciseScreen, ExerciseDetailsScreen } from "app/features/Exercises"
import { CreateNewGymScreen, GymDetailsScreen } from "app/features/Gyms"
import {
  ManageExerciseSettingsScreen,
  ManageMyGymsScreen,
  NotificationsScreen,
  ProfileVisitorViewScreen,
  UserConnectionsScreen,
  UserSettingsScreen,
} from "app/features/UserProfile"
import {
  ActiveWorkoutScreen,
  EditWorkoutScreen,
  RestTimerScreen,
  SaveWorkoutScreen,
  WorkoutGymPickerScreen,
} from "app/features/Workout"
import { WorkoutSummaryScreen } from "app/features/WorkoutSummary"
import {
  EditTemplateScreen,
  TemplateDetailsScreen,
  TemplateManagerScreen,
} from "app/features/WorkoutTemplates"
import { LoadingScreen } from "app/features/common"
import { useNotification } from "app/hooks"
import { translate } from "app/i18n"
import { INotificationModel, useStores } from "app/stores"
import { logError } from "app/utils/logger"
import { toJS } from "mobx"
import { observer } from "mobx-react-lite"
import React, { useCallback, useEffect, useState } from "react"
import { HomeTabNavigator } from "./HomeTabNavigator"
import { OnboardingNavigator } from "./OnboardingNavigator"
import { useMainNavigation } from "./navigationUtilities"

export type MainStackParamList = {
  Splash: undefined
  HomeTabNavigator: undefined
  NewWorkout: undefined
  StartWorkoutWithTemplate: undefined
  TemplateManager: undefined
  EditTemplate?: {
    workoutTemplateId: string
  }
  TemplateDetails: { workoutTemplateId: string }
  ActiveWorkout: undefined
  EditWorkout: undefined
  SaveWorkout: undefined
  WorkoutGymPicker: undefined
  CreateExercise: undefined
  RestTimer: undefined
  ExerciseDetails: { exerciseId: string }
  UserSettings: undefined
  ManageMyGyms: undefined
  ManageExerciseSettings: undefined
  Notifications: undefined
  WorkoutSummary: {
    workoutId: string
    jumpToComments: boolean
  }
  OnboardingNavigator: undefined
  CreateNewGym: { searchString?: string }
  GymDetails: { gymId: string }
  ProfileVisitorView: { userId: string }
  UserConnections: { userId: string; userHandle: string }
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
    activeWorkoutStore,
  } = useStores()
  const mainNavigation = useMainNavigation()
  useNotification()

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
          if (!snapshot.exists) {
            userStore.invalidateSession()
          } else {
            userStore.setUserFromFirebase(snapshot.data() as User)
          }
        },
        (e) => logError(e, "MainNavigator.userSubscriber.onSnapshot error"),
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
          userStore.setFollowRequests([])
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

  const initializeToHome = useCallback(() => {
    // The root navigator is MainNavigator, so we need to get the state of routes[0]
    // If profile is complete and there is nothing in the navigator stack (i.e. MainNavigator not yet initialized to initialRouteName)
    // or the navigator is on "Splash" (i.e. the user has just logged in and MainNavigator mounted for the first time),
    // then we navigate to "HomeTabNavigator"
    const navigationState = mainNavigation.getState()
    const mainNavigatorState = navigationState.routes[0].state // Undefined if MainNavigator not yet initialized
    const currentScreenName =
      mainNavigatorState?.index && mainNavigatorState.routes[mainNavigatorState.index].name
    const isOnInitialScreen = currentScreenName === "Splash"
    console.debug("MainNavigator.initializeToHome()", {
      navigationState,
      mainNavigatorState,
      currentScreenName,
      isOnInitialScreen,
    })

    if (mainNavigatorState === undefined || isOnInitialScreen) {
      console.debug("MainNavigator.initializeToHome(): navigating to HomeTabNavigator")
      mainNavigation.reset({
        index: 0,
        routes: [{ name: "HomeTabNavigator" }],
      })
    }
  }, [mainNavigation])

  useEffect(() => {
    // As long as the user is authenticated, we can start listening to snapshots
    if (!authStore.isAuthenticated) {
      console.debug("MainNavigator.useEffect: User is not authenticated, nothing is done")
      return undefined
    }

    return listenToSnapshots()
  }, [authStore.isAuthenticated])

  // Handle forced navigation to onboarding procedure if profile is incomplete
  useEffect(() => {
    if (userStore.isLoadingProfile) {
      console.debug("MainNavigator.useEffect: User profile is being loaded")
      return
    }

    // If something goes wrong or we add a new field to the user profile, we can force the user to complete the profile again
    if (userStore.profileIncomplete) {
      console.debug("MainNavigator.useEffect: navigating to OnboardingNavigator")
      // Always navigate to "OnboardingNavigator" if profile is incomplete
      mainNavigation.reset({
        index: 0,
        routes: [{ name: "OnboardingNavigator" }],
      })
      return
    }

    // If user is authenticated and profile is complete, then we can initialize the app
    // but this should only be done once
    console.debug("MainNavigator.useEffect", { isInitialized })
    if (!isInitialized && authStore.userId) {
      // Load all exercises and apply user settings
      exerciseStore.getAllExercises().then(() => {
        if (userStore.user) exerciseStore.applyUserSettings(toJS(userStore.user))
      })
      activityStore.getAllActivities()
      feedStore.initializeWithUserId(authStore.userId)

      // If navigation is at initial "Splash" screen, or the stack is empty, then navigate to "HomeTabNavigator"
      initializeToHome()

      setIsInitialized(true)
    }
  }, [isInitialized, authStore.userId, userStore.isLoadingProfile, userStore.profileIncomplete])

  // This is to always apply the user's latest exercise specific settings to exercises
  // but only when there is no active workout in progress, or it could override local settings
  // that have not been saved to the server yet
  useEffect(() => {
    if (userStore.user && !activeWorkoutStore.inProgress) {
      console.debug("MainNavigator.useEffect: applying user settings to exercises")
      exerciseStore.applyUserSettings(toJS(userStore.user))
    }
  }, [exerciseStore.allExercises, userStore.user, activeWorkoutStore.inProgress])

  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false, headerBackButtonMenuEnabled: false }}
      initialRouteName="Splash"
    >
      <MainStack.Screen name="Splash" component={LoadingScreen} />
      <MainStack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />
      <MainStack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />

      <MainStack.Group
        screenOptions={{
          headerShown: true,
          headerBackButtonMenuEnabled: false,
          headerBackTitleVisible: false,
        }}
      >
        <MainStack.Screen
          options={{
            headerTitle: translate("templateManagerScreen.screenTitle"),
          }}
          name="TemplateManager"
          component={TemplateManagerScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="EditTemplate"
          component={EditTemplateScreen}
        />
        <MainStack.Screen
          options={{
            headerTitle: translate("templateDetailsScreen.screenTitle"),
          }}
          name="TemplateDetails"
          component={TemplateDetailsScreen}
        />
      </MainStack.Group>

      <MainStack.Group>
        <MainStack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{
            animation: "slide_from_bottom",
          }}
        />
        <MainStack.Screen name="EditWorkout" component={EditWorkoutScreen} />
        <MainStack.Screen name="SaveWorkout" component={SaveWorkoutScreen} />
        <MainStack.Screen name="WorkoutGymPicker" component={WorkoutGymPickerScreen} />
        <MainStack.Screen
          name="CreateExercise"
          component={CreateExerciseScreen}
          options={{
            headerShown: true,
            headerBackTitleVisible: false,
            title: translate("createExerciseScreen.createExerciseTitle"),
          }}
        />
        <MainStack.Screen
          name="RestTimer"
          options={{
            headerShown: true,
            title: translate("restTimerScreen.headerTitle"),
            headerBackTitleVisible: false,
          }}
          component={RestTimerScreen}
        />
      </MainStack.Group>

      <MainStack.Group>
        <MainStack.Screen
          name="ExerciseDetails"
          options={{
            headerShown: true,
            title: translate("exerciseDetailsScreen.headerTitle"),
            headerBackTitleVisible: false,
          }}
          component={ExerciseDetailsScreen}
        />
        <MainStack.Screen
          name="WorkoutSummary"
          component={WorkoutSummaryScreen}
          options={{
            headerShown: true,
            title: translate("workoutSummaryScreen.headerTitle"),
            headerBackTitleVisible: false,
          }}
        />
      </MainStack.Group>

      <MainStack.Group>
        <MainStack.Screen name="CreateNewGym" component={CreateNewGymScreen} />
        <MainStack.Screen
          name="GymDetails"
          options={{
            headerShown: true,
            title: translate("gymDetailsScreen.headerTitle"),
            headerBackTitleVisible: false,
          }}
          component={GymDetailsScreen}
        />
      </MainStack.Group>

      <MainStack.Group>
        <MainStack.Screen
          name="UserSettings"
          options={{
            gestureEnabled: false,
            headerShown: true,
            headerBackTitleVisible: false,
            headerTitle: translate("editProfileForm.editProfileTitle"),
          }}
          component={UserSettingsScreen}
        />
        <MainStack.Screen
          name="ManageMyGyms"
          component={ManageMyGymsScreen}
          options={{
            headerShown: true,
            title: translate("manageMyGymsScreen.manageMyGymsTitle"),
            headerBackTitleVisible: false,
          }}
        />
        <MainStack.Screen
          name="ManageExerciseSettings"
          component={ManageExerciseSettingsScreen}
          options={{
            headerShown: true,
            title: translate("manageExerciseSettingsScreen.manageExerciseSettingsTitle"),
            headerBackTitleVisible: false,
          }}
        />
      </MainStack.Group>

      <MainStack.Screen
        options={{
          headerShown: true,
          title: translate("notificationsScreen.notificationsTitle"),
          headerBackTitleVisible: false,
        }}
        name="Notifications"
        component={NotificationsScreen}
      />
      <MainStack.Screen
        name="ProfileVisitorView"
        options={{
          headerShown: true,
          title: "",
          headerBackTitleVisible: false,
        }}
        component={ProfileVisitorViewScreen}
      />
      <MainStack.Screen
        name="UserConnections"
        options={{
          headerShown: true,
          title: "",
          headerBackTitleVisible: false,
        }}
        component={UserConnectionsScreen}
      />
    </MainStack.Navigator>
  )
})
