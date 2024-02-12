import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { ActivityType } from "app/data/constants"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Button, Icon, Modal, Spacer, Text } from "../components"
import { translate } from "../i18n"
import {
  ActiveWorkoutOverlay,
  DiscoverScreen,
  ExerciseManagerScreen,
  FeedScreen,
  ProfileScreen,
} from "../screens"
import { spacing, typography } from "../theme"

export type TabParamList = {
  Feed: undefined
  Discover: undefined
  NewActivity: undefined
  // Upcoming: undefined
  // We are putting the exercise manager in place of the "Upcoming" tab for now
  Exercises: undefined
  Profile: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T,
  any
>

const BottomTab = createBottomTabNavigator<TabParamList>()

const EmptyActivityScreen = () => {
  return null
}

// IMPORTANT: This is temporarily disabled and we might revisit this later
// const NewActivityButton = () => {
//   const navigation = useMainNavigation()
//   const { themeStore } = useStores()
//   const [modalVisible, setModalVisible] = useState(false)
//   const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"], "margin")

//   function navigateToNewWorkout() {
//     setModalVisible(false)
//     navigation.navigate("NewWorkout")
//   }

//   function navigateToExerciseManager() {
//     setModalVisible(false)
//     navigation.navigate("ExerciseManager")
//   }

//   const $centerButton: ViewStyle = {
//     bottom: 40,
//     height: 80,
//     width: 80,
//     borderRadius: 80,
//     backgroundColor: themeStore.colors("actionable"),
//     alignItems: "center",
//     justifyContent: "center",
//   }

//   const $centerButtonLabel: TextStyle = {
//     fontSize: 12,
//     fontFamily: typography.primary.medium,
//     color: themeStore.colors("actionableForeground"),
//     lineHeight: 16,
//   }

//   const $activityButtonsContainer: ViewStyle = {
//     flex: 1,
//     bottom: 110,
//     justifyContent: "flex-end",
//     backgroundColor: themeStore.colors("blurBackground"),
//   }

//   return (
//     <>
//       <TouchableOpacity onPress={() => setModalVisible(true)} style={$centerButton}>
//         <Icon name="add" color={themeStore.colors("actionableForeground")} size={30} />
//         <Text style={$centerButtonLabel}>{translate("tabNavigator.activityTab")}</Text>
//       </TouchableOpacity>

//       <Modal
//         transparent={true}
//         visible={modalVisible}
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={[$activityButtonsContainer, $bottomContainerInsets]}>
//           <Button
//             style={$modalButton}
//             tx="tabNavigator.startWorkout"
//             onPress={navigateToNewWorkout}
//           />
//           <Button
//             style={$modalButton}
//             tx="tabNavigator.manageExercises"
//             onPress={navigateToExerciseManager}
//           />
//         </View>
//       </Modal>
//     </>
//   )
// }

type ResetWorkoutDialogProps = {
  visible: boolean
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

const ResetWorkoutDialog: FC<ResetWorkoutDialogProps> = function ResetWorkoutDialog(
  props: ResetWorkoutDialogProps,
) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.visible}
      onRequestClose={props.onCancel}
    >
      <Text tx="newActivityScreen.resumeWorkoutPromptMessage" />
      <Spacer type="vertical" size="medium" />
      <Button tx="newActivityScreen.resumeWorkout" preset="text" onPress={props.onResume} />
      <Button tx="newActivityScreen.startNewWorkoutText" preset="text" onPress={props.onReset} />
      <Button tx="common.cancel" preset="text" onPress={props.onCancel} />
    </Modal>
  )
}

const NewActivityButton = observer(() => {
  const navigation = useMainNavigation()
  const { themeStore, workoutStore } = useStores()
  const [showResetWorkoutDialog, setShowResetWorkoutDialog] = useState(false)

  const startNewWorkout = () => {
    if (workoutStore.inProgress) {
      setShowResetWorkoutDialog(true)
    } else {
      workoutStore.startNewWorkout(ActivityType.Gym)
      navigation.navigate("ActiveWorkout")
    }
  }

  function resumeWorkout() {
    setShowResetWorkoutDialog(false)
    navigation.navigate("ActiveWorkout")
  }

  function resetWorkout() {
    setShowResetWorkoutDialog(false)
    workoutStore.resetWorkout()
    navigation.navigate("ActiveWorkout")
  }

  const $centerButton: ViewStyle = {
    bottom: 40,
    height: 80,
    width: 80,
    borderRadius: 80,
    backgroundColor: themeStore.colors("actionable"),
    alignItems: "center",
    justifyContent: "center",
  }

  const $centerButtonLabel: TextStyle = {
    fontSize: 12,
    fontFamily: typography.primary.medium,
    color: themeStore.colors("actionableForeground"),
    lineHeight: 16,
  }

  return (
    <>
      <TouchableOpacity onPress={startNewWorkout} style={$centerButton}>
        <Icon name="add" color={themeStore.colors("actionableForeground")} size={30} />
        <Text style={$centerButtonLabel}>{translate("tabNavigator.activityTab")}</Text>
      </TouchableOpacity>

      <ResetWorkoutDialog
        visible={showResetWorkoutDialog}
        onResume={resumeWorkout}
        onReset={resetWorkout}
        onCancel={() => setShowResetWorkoutDialog(false)}
      />
    </>
  )
})

export const HomeTabNavigator = observer(() => {
  const { bottom } = useSafeAreaInsets()
  const { workoutStore, themeStore } = useStores()

  const $tabBar: ViewStyle = {
    backgroundColor: themeStore.colors("background"),
    borderTopColor: themeStore.colors("transparent"),
  }

  return (
    <>
      {workoutStore.inProgress && <ActiveWorkoutOverlay />}
      <BottomTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: [$tabBar, { height: bottom + 60 }],
          tabBarActiveTintColor: themeStore.colors("text"),
          tabBarInactiveTintColor: themeStore.colors("text"),
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
              <Icon
                name="people"
                color={focused ? themeStore.colors("tint") : themeStore.colors("foreground")}
                size={20}
              />
            ),
          }}
        />
        <BottomTab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: translate("tabNavigator.discoverTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                name="search-outline"
                color={focused ? themeStore.colors("tint") : themeStore.colors("foreground")}
                size={20}
              />
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
          name="Exercises"
          component={ExerciseManagerScreen}
          options={{
            tabBarLabel: translate("tabNavigator.exercisesTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                name="list-outline"
                color={focused ? themeStore.colors("tint") : themeStore.colors("foreground")}
                size={20}
              />
            ),
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: translate("tabNavigator.profileTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                name="person"
                color={focused ? themeStore.colors("tint") : themeStore.colors("foreground")}
                size={20}
              />
            ),
          }}
        />
      </BottomTab.Navigator>
    </>
  )
})

const $tabBarItem: ViewStyle = {
  paddingTop: spacing.small,
}

const $tabBarLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  flex: 1,
}

// const $modalButton: ViewStyle = {
//   margin: spacing.extraSmall,
//   borderRadius: 20,
//   padding: spacing.extraLarge,
//   alignItems: "center",
// }
