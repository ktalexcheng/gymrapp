import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon, Text } from "../components"
import { translate } from "../i18n"
import {
  ActiveWorkoutOverlay,
  DiscoverScreen,
  FeedScreen,
  ProfileScreen,
  UpcomingScreen,
} from "../screens"
import { colors, spacing, typography } from "../theme"

export type TabParamList = {
  Feed: undefined
  Discover: undefined
  NewActivity: undefined
  Upcoming: undefined
  Profile: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>

const BottomTab = createBottomTabNavigator<TabParamList>()

const EmptyActivityScreen = () => {
  return null
}

// TODO: Create pop up buttons for new activity, new food entry, or new weight entry
const NewActivityButton = () => {
  const navigation = useMainNavigation()
  const [modalVisible, setModalVisible] = useState(false)
  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

  function navigateToNewWorkout() {
    setModalVisible(false)
    navigation.navigate("NewWorkout")
  }

  function navigateToExerciseManager() {
    setModalVisible(false)
    navigation.navigate("ExerciseManager")
  }

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={$centerButton}>
        <Icon name="add" color="white" size={30} />
        <Text style={$centerButtonLabel}>{translate("tabNavigator.activityTab")}</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={[$bottomContainer, $bottomContainerInsets]}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity style={$modalButton} activeOpacity={1} onPress={navigateToNewWorkout}>
            <Text tx="tabNavigator.startWorkout" />
          </TouchableOpacity>
          <TouchableOpacity
            style={$modalButton}
            activeOpacity={1}
            onPress={navigateToExerciseManager}
          >
            <Text tx="tabNavigator.manageExercises" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

export const HomeTabNavigator = observer(() => {
  const { bottom } = useSafeAreaInsets()
  const { userStore, workoutStore } = useStores()
  const mainNavigation = useMainNavigation()

  useEffect(() => {
    console.debug("HomeTabNavigator.useEffect [userStore.profileIncomplete] called")
    if (userStore.profileIncomplete) {
      console.debug("Profile is incomplete, navigating to OnboardingNavigator")
      mainNavigation.navigate("OnboardingNavigator")
    }
  }, [userStore.profileIncomplete])

  return (
    <>
      {workoutStore.inProgress && <ActiveWorkoutOverlay />}
      <BottomTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: [$tabBar, { height: bottom + 60 }],
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: $tabBarLabel,
          tabBarItemStyle: $tabBarItem,
        }}
      >
        <BottomTab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarLabel: translate("tabNavigator.feedTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="people" color={focused && colors.tint} size={20} />
            ),
          }}
        />
        <BottomTab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: translate("tabNavigator.discoverTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="search-outline" color={focused && colors.tint} size={20} />
            ),
          }}
        />
        <BottomTab.Screen
          name="NewActivity"
          component={EmptyActivityScreen}
          options={{
            tabBarButton: () => <NewActivityButton />,
          }}
        />
        <BottomTab.Screen
          name="Upcoming"
          component={UpcomingScreen}
          options={{
            tabBarLabel: translate("tabNavigator.upcomingTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="calendar-outline" color={focused && colors.tint} size={20} />
            ),
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: translate("tabNavigator.profileTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="person" color={focused && colors.tint} size={20} />
            ),
          }}
        />
      </BottomTab.Navigator>
    </>
  )
})

const $tabBar: ViewStyle = {
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
}

const $tabBarItem: ViewStyle = {
  paddingTop: spacing.small,
}

const $tabBarLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  flex: 1,
}

const $centerButton: ViewStyle = {
  bottom: 40,
  height: 80,
  width: 80,
  borderRadius: 80,
  backgroundColor: colors.actionable,
  alignItems: "center",
  justifyContent: "center",
}

const $centerButtonLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  color: "white",
  lineHeight: 16,
}

const $modalButton: ViewStyle = {
  margin: 20,
  backgroundColor: "white",
  borderRadius: 20,
  padding: 35,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
}

const $bottomContainer: ViewStyle = {
  bottom: 100,
  flex: 1,
  justifyContent: "flex-end",
}
