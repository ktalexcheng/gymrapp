import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Button, Icon, Modal, Sheet, Spacer, Text } from "app/components"
import { ActivityType } from "app/data/constants"
import { DiscoverScreen } from "app/features/Discover"
import { ExerciseManagerScreen } from "app/features/Exercises"
import { FeedScreen } from "app/features/Feed"
import { ProfileScreen } from "app/features/UserProfile"
import { ActiveWorkoutOverlay } from "app/features/Workout"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, typography } from "app/theme"
import { FilePlus2, LayoutTemplate } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { Platform, StyleProp, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

export type TabParamList = {
  Feed: undefined
  Discover: undefined
  NewActivity: undefined
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

type ResetWorkoutDialogProps = {
  visible: boolean
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

const ResetWorkoutDialog: FC<ResetWorkoutDialogProps> = observer(function ResetWorkoutDialog(
  props: ResetWorkoutDialogProps,
) {
  const { themeStore } = useStores()

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
      <Button
        tx="common.cancel"
        textStyle={{ color: themeStore.colors("text") }}
        preset="text"
        onPress={props.onCancel}
      />
    </Modal>
  )
})

const NewActivityButton = observer(() => {
  const navigation = useMainNavigation()
  const { themeStore, activeWorkoutStore } = useStores()

  const [showResetWorkoutDialog, setShowResetWorkoutDialog] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const startNewWorkout = () => {
    setIsSheetOpen(false)
    if (activeWorkoutStore.inProgress) {
      setShowResetWorkoutDialog(true)
    } else {
      activeWorkoutStore.startNewWorkout(ActivityType.Gym)
      navigation.navigate("ActiveWorkout")
    }
  }

  function resumeWorkout() {
    setShowResetWorkoutDialog(false)
    navigation.navigate("ActiveWorkout")
  }

  function resetWorkout() {
    setShowResetWorkoutDialog(false)
    activeWorkoutStore.startNewWorkout(ActivityType.Gym)
    navigation.navigate("ActiveWorkout")
  }

  function manageTemplates() {
    setIsSheetOpen(false)
    navigation.navigate("TemplateManager")
  }

  const $centerButton: ViewStyle = {
    bottom: 40,
    height: 80,
    width: 80,
    borderRadius: 80,
    backgroundColor: themeStore.colors("actionable"),
    alignItems: "center",
    justifyContent: "center",
    elevation: 15,
    shadowRadius: 15,
    shadowOpacity: 0.5,
    shadowColor: themeStore.palette("neutral050"),
  }

  const $centerButtonLabel: TextStyle = {
    fontSize: 12,
    fontFamily: typography.primary.medium,
    color: themeStore.colors("actionableForeground"),
    lineHeight: 16,
  }

  const $sheetContent: ViewStyle = {
    backgroundColor: themeStore.colors("background"),
    padding: spacing.screenPadding,
    gap: spacing.extraSmall,
  }

  const $buttonLeftAcc: ViewStyle = { position: "absolute", left: spacing.small }

  const $button: ViewStyle = {
    minHeight: 60,
  }

  return (
    <>
      <TouchableOpacity onPress={() => setIsSheetOpen(true)}>
        <View style={$centerButton}>
          <Icon name="add" color={themeStore.colors("actionableForeground")} size={30} />
          <Text style={$centerButtonLabel}>{translate("tabNavigator.activityTab")}</Text>
        </View>
      </TouchableOpacity>

      <Sheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[50]}
        snapPointsMode="percent"
        defaultPosition={0}
      >
        <View style={$sheetContent}>
          <Button
            style={$button}
            LeftAccessory={() => (
              <FilePlus2 style={$buttonLeftAcc} color={themeStore.colors("actionable")} />
            )}
            tx="tabNavigator.startNewWorkoutLabel"
            onPress={startNewWorkout}
          />
          <Button
            style={$button}
            LeftAccessory={() => (
              <LayoutTemplate style={$buttonLeftAcc} color={themeStore.colors("actionable")} />
            )}
            tx="tabNavigator.manageTemplatesLabel"
            onPress={manageTemplates}
          />
        </View>
      </Sheet>

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
  const { activeWorkoutStore, themeStore } = useStores()

  const $tabBar: StyleProp<ViewStyle> = [
    {
      backgroundColor: themeStore.colors("background"),
      borderTopColor: themeStore.colors("transparent"),
      marginTop: spacing.screenPadding,
      elevation: 0, // Remove the shadow on Android
    },
    Platform.select({
      ios: {
        marginBottom: spacing.small,
      },
      android: {
        paddingBottom: spacing.small,
      },
    }),
  ]

  const tabIconColor = (focused: boolean) => {
    return focused ? themeStore.colors("logo") : themeStore.colors("disabledBackground")
  }

  return (
    <>
      {activeWorkoutStore.inProgress && <ActiveWorkoutOverlay />}
      <BottomTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: $tabBar,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <BottomTab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarLabel: translate("tabNavigator.feedTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="people" color={tabIconColor(focused)} size={20} />
            ),
          }}
        />
        <BottomTab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarLabel: translate("tabNavigator.discoverTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="search-outline" color={tabIconColor(focused)} size={20} />
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
              <Icon name="list-outline" color={tabIconColor(focused)} size={20} />
            ),
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: translate("tabNavigator.profileTab"),
            tabBarIcon: ({ focused }) => (
              <Icon name="person" color={tabIconColor(focused)} size={20} />
            ),
          }}
        />
      </BottomTab.Navigator>
    </>
  )
})
