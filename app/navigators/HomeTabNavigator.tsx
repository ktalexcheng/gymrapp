import Ionicons from "@expo/vector-icons/Ionicons"
import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsetsStyle } from "app/utils/useSafeAreaInsetsStyle"
import React, { useState } from "react"
import { Modal, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "../components"
import { translate } from "../i18n"
import { FeedScreen, ProfileScreen } from "../screens"
import { colors, spacing, typography } from "../theme"

export type TabParamList = {
  Feed: undefined
  ActivityNavigator: undefined
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

export function HomeTabNavigator({ navigation }) {
  const { bottom } = useSafeAreaInsets()

  // TODO: Create pop up buttons for new activity, new food entry, or new weight entry
  const NewActivityButton = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

    function navigateToNewActivity() {
      setModalVisible(false)
      navigation.navigate("ActivityNavigator")
    }

    return (
      <>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={$centerButton}>
          <Ionicons name="add" color="white" size={30} />
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
            <TouchableOpacity style={$modalView} activeOpacity={1} onPress={navigateToNewActivity}>
              <Text tx="tabNavigator.startWorkout" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </>
    )
  }

  return (
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
            <Ionicons name="people" color={focused && colors.tint} size={20} />
          ),
        }}
      />
      <BottomTab.Screen
        name="ActivityNavigator"
        component={EmptyActivityScreen}
        options={{
          tabBarButton: () => <NewActivityButton />,
        }}
      />
      <BottomTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: translate("tabNavigator.profileTab"),
          tabBarIcon: ({ focused }) => (
            <Ionicons name="person" color={focused && colors.tint} size={20} />
          ),
        }}
      />
    </BottomTab.Navigator>
  )
}

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
  backgroundColor: colors.actionBackground,
  alignItems: "center",
  justifyContent: "center",
}

const $centerButtonLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  color: "white",
  lineHeight: 16,
}

const $modalView: ViewStyle = {
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
