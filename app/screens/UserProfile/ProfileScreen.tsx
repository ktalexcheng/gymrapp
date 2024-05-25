import {
  Avatar,
  Icon,
  LoadingIndicator,
  RowView,
  Screen,
  Spacer,
  TabBar,
  Text,
  ThemedRefreshControl,
} from "app/components"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { format, milliseconds } from "date-fns"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { DomainPropType, DomainTuple } from "victory-core"
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryZoomContainer,
} from "victory-native"
import { WorkoutSummaryCard } from "../FinishedWorkout"
import { LoadingScreen } from "../LoadingScreen"
import { UserProfileStatsBar } from "./UserProfileStatsBar"

const UserActivitiesTabScene: FC = observer(() => {
  const { userStore, feedStore } = useStores()
  const [workoutsListData, setWorkoutsListData] = useState(feedStore.userWorkoutsListData)

  useEffect(() => {
    if (!feedStore.feedStoreIsBusy && feedStore.userWorkoutsListData) {
      setWorkoutsListData(feedStore.userWorkoutsListData)
    }
  }, [feedStore.feedStoreIsBusy, feedStore.userWorkoutsListData])

  function renderWorkoutItem({ item }) {
    return <WorkoutSummaryCard {...item} byUser={userStore.user} />
  }

  return (
    <FlatList
      data={workoutsListData}
      refreshControl={
        <ThemedRefreshControl
          onRefresh={feedStore.loadUserWorkouts}
          refreshing={feedStore.isLoadingUserWorkouts}
        />
      }
      renderItem={renderWorkoutItem}
      showsVerticalScrollIndicator={false}
      // ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
      contentContainerStyle={styles.flexGrow}
      ListEmptyComponent={() => (
        <View style={styles.fillAndCenter}>
          <Text tx="profileScreen.noActivityHistory" />
        </View>
      )}
      ListFooterComponent={() =>
        workoutsListData?.length > 0 && <Spacer type="vertical" size="extraLarge" />
      }
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

const WeeklyWorkoutChart: FC<WeeklyWorkoutChartProps> = observer(({ data }) => {
  const { themeStore } = useStores()

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
    const tickValuesY: number[] = []
    if (!zoomedDomain?.y?.[1]) return tickValuesY

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
        style={{
          axis: { stroke: themeStore.colors("foreground") },
          tickLabels: { fill: themeStore.colors("foreground") },
        }}
      />
      <VictoryAxis
        dependentAxis
        tickValues={getYTickValues()}
        style={{
          axis: { stroke: themeStore.colors("foreground") },
          tickLabels: { fill: themeStore.colors("foreground") },
        }}
      />
      <VictoryBar
        data={getVisibleData()}
        x="weekStartDate"
        y="workoutsCount"
        labels={({ datum }) => datum.workoutsCount}
        labelComponent={<VictoryLabel dy={20} />}
        style={{
          data: { fill: themeStore.colors("tint") },
          labels: { fill: themeStore.colors("actionableForeground") },
        }}
        barWidth={24}
        cornerRadius={4}
      />
    </VictoryChart>
  )
})

const DashboardTabScene: FC = observer(() => {
  const { feedStore } = useStores()

  if (feedStore.isLoadingUserWorkouts) return <LoadingIndicator />
  if (feedStore.userWorkouts.length === 0)
    return (
      <View style={styles.fillAndCenter}>
        <Text tx="profileScreen.noActivityHistory" />
      </View>
    )

  return (
    <>
      <Text preset="subheading" tx="profileScreen.dashboardWeeklyWorkoutsTitle" />
      <WeeklyWorkoutChart data={feedStore.weeklyWorkoutsCount} />
    </>
  )
})

// interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore, feedStore, activeWorkoutStore, themeStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]
  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    console.debug("ProfileScreen mounted")
    userStore.fetchUserProfile()
    feedStore.loadUserWorkouts()
  }, [])

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
    return <TabBar tabIndex={tabIndex} setTabIndex={setTabIndex} {...props} />
  }

  const $notificationsBadge: ViewStyle = {
    backgroundColor: themeStore.colors("tint"),
    borderRadius: 4,
    paddingHorizontal: 2,
    position: "absolute",
    top: -5,
    right: -5,
    alignItems: "center",
    justifyContent: "center",
  }

  const $notificationsBadgeText: TextStyle = {
    color: themeStore.colors("tintForeground"),
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
  }

  if (!userStore.user) return <LoadingScreen />

  return (
    <Screen
      safeAreaEdges={safeAreaEdges}
      contentContainerStyle={$screenContentContainer}
      isBusy={userStore.isLoadingProfile}
    >
      {!userStore.isLoadingProfile && (
        <>
          <RowView alignItems="center" style={$userAvatarRow}>
            <TouchableOpacity onPress={() => mainNavigation.navigate("UserSettings")}>
              <RowView alignItems="center">
                <Avatar user={userStore.user} size="sm" />
                <View style={$userDisplayName}>
                  <Text weight="semiBold" text={userStore.getPropAsJS("user.userHandle")} />
                  <Text weight="light" text={userStore.displayName} />
                </View>
              </RowView>
            </TouchableOpacity>
            <View>
              <Icon
                name="notifications-outline"
                onPress={() => mainNavigation.navigate("Notifications")}
                size={32}
              />
              {userStore.newNotificationsCount > 0 && (
                <View style={$notificationsBadge}>
                  <Text
                    style={$notificationsBadgeText}
                    text={`${Math.min(userStore.newNotificationsCount, 99)}`}
                  />
                </View>
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
