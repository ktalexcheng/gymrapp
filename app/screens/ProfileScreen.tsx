import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Icon, RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { translate } from "app/i18n"
import { TabScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { DomainPropType } from "victory-core"
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryZoomContainer,
} from "victory-native"
import { colors, spacing } from "../theme"
import { WorkoutSummaryCard } from "./FinishedWorkout"

const UserActivitiesTabScene: FC = observer(() => {
  const { userStore } = useStores()

  function getWorkoutData() {
    const workouts = Array.from(userStore.workouts.values())
    workouts.sort((a, b) => (a.workout.endTime > b.workout.endTime ? -1 : 1))

    return workouts
  }

  function renderWorkoutItem({ item }) {
    return <WorkoutSummaryCard {...item} />
  }

  if (userStore.isLoadingWorkouts) return <Text tx="common.loading" />
  if (userStore.workouts.size === 0) return <Text tx="profileScreen.noActivityhistory" />

  return (
    <FlatList
      data={getWorkoutData()}
      renderItem={renderWorkoutItem}
      ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
    />
  )
})

type WeeklyWorkoutChartProps = {
  data: Map<number, number>
}

const WeeklyWorkoutChart: FC<WeeklyWorkoutChartProps> = ({ data }) => {
  const dataKeys = [...data.keys()]
  // Note: Domain having the same value for left/right bounds will result in a warning,
  //       (this happens when there is only one data point)
  //       to workaround this, we add one to the right bound
  const entireDomain: DomainPropType = {
    x: [dataKeys[0], dataKeys[data.size - 1] + 1],
    y: [0, 7],
  }
  const initialZoomDomain: DomainPropType = {
    x: [dataKeys[Math.max(data.size - 8, 0)], dataKeys[data.size - 1] + 1],
    y: [0, 7],
  }
  const [zoomedDomain, setZoomDomain] = useState(initialZoomDomain)

  const getVisibleData = () => {
    const filteredData = [...data.entries()].filter(([key]) => {
      return key >= (zoomedDomain.x?.[0] as number) && key <= (zoomedDomain.x?.[1] as number)
    })
    const barChartData = filteredData.map(([key, value]) => {
      return { weekStartDate: key, workoutsCount: value }
    })

    return barChartData
  }

  // Note: VictoryAxis and VictoryBar throws a warning when there is only 1 x-axis domain value
  return (
    <VictoryChart
      domain={entireDomain}
      containerComponent={
        <VictoryZoomContainer
          responsive={false}
          allowPan={true}
          allowZoom={false}
          zoomDimension="x"
          zoomDomain={zoomedDomain}
          onZoomDomainChange={setZoomDomain}
        />
      }
    >
      <VictoryAxis
        tickFormat={(x: number) => format(x, "MM/dd")}
        tickValues={getVisibleData().map((d) => d.weekStartDate)}
        domainPadding={{ x: [spacing.tiny, spacing.tiny] }}
        tickLabelComponent={<VictoryLabel angle={-45} dy={spacing.tiny} dx={-spacing.tiny * 2} />}
      />
      <VictoryAxis dependentAxis tickValues={[1, 2, 3, 4, 5, 6, 7]} />
      <VictoryBar
        data={getVisibleData()}
        x="weekStartDate"
        y="workoutsCount"
        labels={({ datum }) => datum.workoutsCount}
        labelComponent={<VictoryLabel dy={20} />}
        style={{ data: { fill: colors.actionable }, labels: { fill: "white" } }}
        barWidth={24}
        cornerRadius={4}
      />
    </VictoryChart>
  )
}

const DashboardTabScene: FC = observer(() => {
  const { userStore } = useStores()

  if (userStore.isLoadingWorkouts) return <Text tx="common.loading" />
  if (userStore.workouts.size === 0) return <Text tx="profileScreen.noActivityhistory" />

  return (
    <>
      <Text preset="subheading" tx="profileScreen.dashboardWeeklyWorkoutsTitle" />
      <WeeklyWorkoutChart data={userStore.weeklyWorkoutsCount} />
    </>
  )
})

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()
  const [tabIndex, setTabIndex] = useState(0)
  // TODO: Update coach identity from user collection
  const isTrainer = false

  const $coachsCenterButtonStatus: ViewStyle | TextStyle = {
    backgroundColor: isTrainer ? colors.actionable : colors.disabled,
    color: isTrainer ? colors.text : colors.textDim,
  }

  const routes = [
    {
      key: "activities",
      title: translate("profileScreen.activitiesTabLabel"),
    },
    {
      key: "dashboard",
      title: translate("profileScreen.dashboardTabLabel"),
    },
  ]

  const renderScene = SceneMap({
    activities: UserActivitiesTabScene,
    dashboard: DashboardTabScene,
  })

  const renderTabBar = (props) => {
    const $tabBarStyle: ViewStyle = {
      marginBottom: spacing.tiny,
    }

    return (
      <View style={$tabBarStyle}>
        <TabBar tabIndex={tabIndex} setTabIndex={setTabIndex} {...props} />
      </View>
    )
  }

  if (!userStore.userProfileExists) return null

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$screenContentContainer}>
      {userStore.isLoadingProfile ? (
        <Text tx="common.loading" />
      ) : (
        <>
          <RowView alignItems="center" style={$userAvatarRow}>
            <RowView alignItems="center">
              <Avatar user={userStore.user} size="md" />
              <Text style={$userDisplayName}>{userStore?.displayName}</Text>
            </RowView>
            <Icon
              name="settings-outline"
              onPress={() => mainNavigation.navigate("UserSettings")}
              color={colors.actionable}
              size={32}
            />
          </RowView>
          <RowView style={$coachsCenterRow}>
            <TouchableOpacity style={[$coachsCenterButton, $coachsCenterButtonStatus]}>
              <Text tx="profileScreen.coachsCenterButtonLabel"></Text>
            </TouchableOpacity>
          </RowView>
          <View style={$tabViewContainer}>
            <TabView
              navigationState={{ index: tabIndex, routes }}
              renderScene={renderScene}
              renderTabBar={renderTabBar}
              onIndexChange={setTabIndex}
            />
          </View>
        </>
      )}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  paddingVertical: spacing.large,
  paddingHorizontal: spacing.large,
}

const $userAvatarRow: ViewStyle = {
  justifyContent: "space-between",
  marginBottom: spacing.large,
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}

const $coachsCenterRow: ViewStyle = {
  justifyContent: "flex-end",
}

const $coachsCenterButton: ViewStyle = {
  height: 30,
  borderRadius: 15,
  paddingHorizontal: spacing.medium,
  justifyContent: "center",
}

const $tabViewContainer: ViewStyle = {
  flex: 1,
  // justifyContent: "center",
  // alignItems: "center",
}
