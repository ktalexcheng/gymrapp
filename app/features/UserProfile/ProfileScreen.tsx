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
import { LoadingScreen } from "app/features/common/LoadingScreen"
import { WorkoutSummaryCard } from "app/features/WorkoutSummary"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, processColor, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { BarChart } from "react-native-charts-wrapper"
import { SceneMap, TabView } from "react-native-tab-view"
import { UserProfileStatsBar } from "./components/UserProfileStatsBar"

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
  chartData: { weekStartDate: number; workoutsCount: number }[]
}

/**
 * This was a test using victory-native-xl but it didn't support pan/zoom yet
 * so we switched to react-native-charts-wrapper, keeping this code for reference
 */
// const WeeklyWorkoutChart = observer(({ data }: WeeklyWorkoutChartProps) => {
//   const { themeStore } = useStores()
//   const fontMgr = useFonts({
//     primary: Object.values(typography.primary).map((f) => customFontsToLoad[f]),
//   })
//   if (!fontMgr) return <LoadingIndicator />
//   const font = matchFont(
//     {
//       fontFamily: "primary",
//       fontSize: 12,
//       fontWeight: "normal",
//     },
//     fontMgr,
//   )

//   const barChartData = [...data.entries()].map(([key, value]) => {
//     return { weekStartDate: key, workoutsCount: value }
//   })
//   barChartData.sort((a, b) => a.weekStartDate - b.weekStartDate)
//   const lastDataIdx = barChartData.length - 1

//   if (barChartData.length === 0) return <LoadingIndicator />

//   const getXTickValues = () => {
//     return barChartData.map((d) => d.weekStartDate)
//   }

//   const getYTickValues = () => {
//     // render at least 7 ticks on Y axis, or the max value of workoutsCount
//     const tickValuesY: number[] = []
//     const maxY = Math.max(7, ...barChartData.map((d) => d.workoutsCount))
//     for (let i = 0; i <= maxY; i++) {
//       tickValuesY.push(i)
//     }
//     return tickValuesY
//   }

//   return (
//     <View style={{ height: 200 }}>
//       <CartesianChart
//         data={barChartData}
//         xKey={"weekStartDate"}
//         yKeys={["workoutsCount"]}
//         domain={{
//           x: [
//             barChartData[lastDataIdx - 13].weekStartDate,
//             barChartData[lastDataIdx].weekStartDate,
//           ],
//           y: [0, Math.max(7, ...barChartData.map((d) => d.workoutsCount))],
//         }}
//         domainPadding={{ left: spacing.large, right: spacing.large, top: spacing.large }}
//         axisOptions={{
//           font,
//           lineColor: {
//             grid: {
//               x: themeStore.colors("background"),
//               y: themeStore.colors("foreground"),
//             },
//             frame: themeStore.colors("foreground"),
//           },
//           labelColor: themeStore.colors("foreground"),
//           tickValues: {
//             x: getXTickValues(),
//             y: getYTickValues(),
//           },
//           formatXLabel: (x) => format(x, "MM/dd"),
//           formatYLabel: (y) => y.toString(),
//         }}
//       >
//         {({ points, chartBounds }) => (
//           // 👇 and we'll use the Line component to render a line path.
//           <Bar
//             points={points.workoutsCount}
//             chartBounds={chartBounds}
//             color={themeStore.colors("actionable")}
//             roundedCorners={{ topLeft: 4, topRight: 4 }}
//           />
//         )}
//       </CartesianChart>
//     </View>
//   )
// })

const WeeklyWorkoutChart = observer(({ chartData }: WeeklyWorkoutChartProps) => {
  const { themeStore } = useStores()

  const barChartdata = {
    dataSets: [
      {
        label: translate("profileScreen.dashboardWeeklyWorkoutsTitle"), // This is required but only affects legends
        values: chartData.map(({ workoutsCount }) => ({
          y: workoutsCount,
        })),
        config: {
          color: processColor(themeStore.colors("actionable")),
          valueTextColor: processColor(themeStore.colors("actionableForeground")),
          valueTextSize: 12,
          highlightEnabled: false,
          valueFormatter: chartData.map((d) => d.workoutsCount.toFixed(0)),
        },
      },
    ],
    config: {
      barWidth: 0.7,
    },
  }

  const legend = {
    enabled: false,
  }

  const xAxis = {
    valueFormatter: chartData.map((d) => format(d.weekStartDate, "MM/dd")),
    position: "BOTTOM",
    // labelRotationAngle: -45, // labels get cut off when rotated and visibleRange is set on BarChart
    drawLabels: true,
    drawGridLines: false,
    granularity: 1,
    granularityEnabled: true,
  }

  const yAxis = {
    left: {
      granularity: 1,
      granularityEnabled: true,
      axisMinimum: 0,
      axisMaximum: Math.max(7, ...chartData.map((d) => d.workoutsCount)),
      // limitLines can be used to set weekly target
      // limitLines: [
      //   {
      //     limit: 4,
      //     lineWidth: 2,
      //   },
      // ],
    },
    right: {
      enabled: false,
    },
  }

  return (
    <View style={styles.flex1}>
      <BarChart
        // eslint-disable-next-line react-native/no-inline-styles
        style={{ height: 200 }}
        legend={legend}
        xAxis={xAxis}
        yAxis={yAxis}
        data={barChartdata}
        drawValueAboveBar={false}
        touchEnabled={true}
        dragEnabled={true}
        doubleTapToZoomEnabled={false}
        dragDecelerationEnabled={false}
        visibleRange={{ x: { min: 8, max: 8 } }}
        zoom={{ scaleX: 1, scaleY: 1, xValue: chartData.length, yValue: 0 }} // Set initial view to end of data
      />
    </View>
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

  const data = [...feedStore.weeklyWorkoutsCount.entries()].map(
    ([weekStartDate, workoutsCount]) => ({
      weekStartDate,
      workoutsCount,
    }),
  )
  data.sort((a, b) => a.weekStartDate - b.weekStartDate)

  return (
    <>
      <Text preset="subheading" tx="profileScreen.dashboardWeeklyWorkoutsTitle" />
      <WeeklyWorkoutChart chartData={data} />
    </>
  )
})

export const ProfileScreen = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore, feedStore, activeWorkoutStore, themeStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]
  const [tabIndex, setTabIndex] = useState(1) // TODO: DEBUG ONLY

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
    return (
      <TabBar
        {...props}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        style={{ marginBottom: spacing.small }}
      />
    )
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
}
