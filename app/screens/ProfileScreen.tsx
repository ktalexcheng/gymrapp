import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Icon, RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { translate } from "app/i18n"
import { TabScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { format, milliseconds } from "date-fns"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { FlatList, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { DomainPropType, DomainTuple } from "victory-core"
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryZoomContainer,
} from "victory-native"
import { colors, spacing } from "../theme"
import { WorkoutSummaryCard } from "./FinishedWorkout"
import { UserProfileStatsBar } from "./UserProfile/UserProfileStatsBar"

const UserActivitiesTabScene: FC = observer(() => {
  const { userStore, feedStore } = useStores()

  function getWorkoutData() {
    const workouts = Array.from(feedStore.userWorkouts.values())
    workouts.sort((a, b) => (a.workout.startTime > b.workout.startTime ? -1 : 1))

    return workouts.map((workout) => {
      return {
        ...workout,
        byUser: userStore.user,
        workoutSource: WorkoutSource.User,
      }
    })
  }

  function renderWorkoutItem({ item }) {
    return <WorkoutSummaryCard {...item} />
  }

  if (feedStore.isLoadingUserWorkouts) return <Text tx="common.loading" />
  if (feedStore.userWorkouts.size === 0) return <Text tx="profileScreen.noActivityhistory" />

  return (
    <FlatList
      data={getWorkoutData()}
      renderItem={renderWorkoutItem}
      ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
    />
  )
})

type WeeklyWorkoutChartProps = {
  // data is a map of week start date (in milliseconds) to number of workouts
  data: Map<number, number>
}

type VictoryDomainType = {
  x?: DomainTuple
  y?: DomainTuple
}

const WeeklyWorkoutChart: FC<WeeklyWorkoutChartProps> = ({ data }) => {
  // Constant for date arithmetics
  const weekAsMilliseconds = milliseconds({ weeks: 1 })

  // data parameter contains the entire data set, but we only want to show the visible data
  const dataKeys = [...data.keys()]
  // Construct zoom domain
  // We want to show a T-8 weeks window of data
  // If there is < 8 weeks of data, we need still need to set
  // zoom domain to T-8 weeks for proper bar spacing
  const maxX = Math.max(...dataKeys)
  const maxXMinus8Weeks = maxX - weekAsMilliseconds * 8
  const maxY = Math.max(7, ...data.values())
  // Domain having the same value for left/right bounds will result in a warning,
  // (this happens when there is only one data point)
  // also, we need to pad the domain by a week on both ends to show the first and last bar
  const entireDomain: DomainPropType = {
    x: [Math.min(maxXMinus8Weeks, dataKeys[0]) - weekAsMilliseconds, maxX + weekAsMilliseconds],
    y: [0, maxY],
  }
  const initialZoomDomain: DomainPropType = {
    x: [maxXMinus8Weeks - weekAsMilliseconds, maxX + weekAsMilliseconds],
    y: [0, maxY],
  }
  const [zoomedDomain, setZoomDomain] = useState<VictoryDomainType>(initialZoomDomain)

  const filterData = (minX, maxX) => {
    return [...data.entries()].filter(([key]) => {
      return key >= minX && key <= maxX
    })
  }

  const getVisibleData = () => {
    const visibleData = filterData(zoomedDomain.x?.[0], zoomedDomain.x?.[1])
    const barChartData = visibleData.map(([key, value]) => {
      return { weekStartDate: key, workoutsCount: value }
    })
    return barChartData
  }

  const handleZoomDomainChange = (domain: { x: DomainTuple; y: DomainTuple }) => {
    // Updated zoomed domain for Y axis to match the max value of visible data
    const visibleData = filterData(domain.x[0], domain.x[1])
    const maxY = Math.max(7, ...visibleData.map(([, value]) => value))
    const updatedZoomDomain = {
      x: domain.x,
      y: [domain.y[0], maxY] as DomainTuple,
    }
    setZoomDomain(updatedZoomDomain)
  }

  const getXTickValues = () => {
    const tickValuesX = getVisibleData().map((d) => d.weekStartDate)
    return tickValuesX
  }

  const getYTickValues = () => {
    const tickValuesY = []
    for (let i = 0; i <= (zoomedDomain.y[1] as number); i++) {
      tickValuesY.push(i)
    }
    return tickValuesY
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
          zoomDomain={zoomedDomain}
          onZoomDomainChange={handleZoomDomainChange}
        />
      }
    >
      <VictoryAxis
        tickFormat={(x: number) => format(x, "MM/dd")}
        tickValues={getXTickValues()}
        tickLabelComponent={<VictoryLabel angle={-45} dy={-spacing.tiny} dx={-spacing.tiny * 4} />}
      />
      <VictoryAxis dependentAxis tickValues={getYTickValues()} />
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
  const { feedStore } = useStores()

  if (feedStore.isLoadingUserWorkouts) return <Text tx="common.loading" />
  if (feedStore.userWorkouts.size === 0) return <Text tx="profileScreen.noActivityhistory" />

  return (
    <>
      <Text preset="subheading" tx="profileScreen.dashboardWeeklyWorkoutsTitle" />
      <WeeklyWorkoutChart data={feedStore.weeklyWorkoutsCount} />
    </>
  )
})

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore, workoutStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = workoutStore.inProgress ? ["bottom"] : ["top", "bottom"]

  const [tabIndex, setTabIndex] = useState(0)
  // const isTrainer = false

  // const $coachsCenterButtonStatus: ViewStyle | TextStyle = {
  //   backgroundColor: isTrainer ? colors.actionable : colors.disabled,
  //   color: isTrainer ? colors.text : colors.textDim,
  // }

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
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={$screenContentContainer}>
      {userStore.isLoadingProfile ? (
        <Text tx="common.loading" />
      ) : (
        <>
          <RowView alignItems="center" style={$userAvatarRow}>
            <TouchableOpacity onPress={() => mainNavigation.navigate("UserSettings")}>
              <RowView alignItems="center">
                <Avatar user={userStore.user} size="sm" />
                <Text style={$userDisplayName}>{userStore?.displayName}</Text>
              </RowView>
            </TouchableOpacity>
            <View>
              <Icon
                name="notifications-outline"
                onPress={() => mainNavigation.navigate("Notifications")}
                color={colors.actionable}
                size={32}
              />
              {userStore.newNotificationsCount > 0 && (
                <Text style={$notificationsBadge} text={`${userStore.newNotificationsCount}`} />
              )}
            </View>
          </RowView>
          <UserProfileStatsBar user={userStore.user} containerStyle={$userProfileStatsBar} />
          {/* <RowView style={$coachsCenterRow}>
            <TouchableOpacity style={[$coachsCenterButton, $coachsCenterButtonStatus]}>
              <Text tx="profileScreen.coachsCenterButtonLabel"></Text>
            </TouchableOpacity>
          </RowView> */}
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
}

const $userProfileStatsBar: ViewStyle = {
  marginVertical: spacing.medium,
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}

const $tabViewContainer: ViewStyle = {
  flex: 1,
  // justifyContent: "center",
  // alignItems: "center",
}

const $notificationsBadge: ViewStyle = {
  position: "absolute",
  top: -5,
  right: -5,
}
