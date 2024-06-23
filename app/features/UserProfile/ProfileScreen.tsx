import {
  Avatar,
  ButtonGroup,
  Icon,
  LoadingIndicator,
  Popover,
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
import { format, sub } from "date-fns"
import { Info } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import {
  FlatList,
  FlatListProps,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  processColor,
  ScrollView,
  ScrollViewProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { BarChart, HorizontalBarChart } from "react-native-charts-wrapper"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { SceneMap, TabView } from "react-native-tab-view"
import { UserProfileStatsBar } from "./components/UserProfileStatsBar"

type UserActivitiesTabSceneProps = {
  onScroll: FlatListProps<any>["onScroll"]
}

const UserActivitiesTabScene = observer((props: UserActivitiesTabSceneProps) => {
  const { onScroll } = props

  const { userStore, feedStore } = useStores()

  function renderWorkoutItem({ item }) {
    return <WorkoutSummaryCard {...item} byUser={userStore.user} />
  }

  return (
    <FlatList
      data={feedStore.userWorkoutsListData}
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
        feedStore.userWorkoutsListData?.length > 0 && (
          <Spacer type="vertical" size="listFooterPadding" />
        )
      }
      onScroll={onScroll}
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
          // Using "" for 0 to prevent from overlapping with x-axis labels
          valueFormatter: chartData.map((d) => (d.workoutsCount ? d.workoutsCount.toFixed(0) : "")),
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
      drawGridLines: false,
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
      <Text preset="subheading" tx="profileScreen.dashboardWeeklyWorkoutsTitle" />
      <BarChart
        // eslint-disable-next-line react-native/no-inline-styles
        style={{ height: 200 }}
        legend={legend}
        xAxis={xAxis}
        yAxis={yAxis}
        data={barChartdata}
        chartDescription={{ text: "" }}
        drawValueAboveBar={false}
        touchEnabled={true}
        dragEnabled={true}
        doubleTapToZoomEnabled={false}
        dragDecelerationEnabled={true}
        dragDecelerationFrictionCoef={0.9}
        visibleRange={{ x: { min: 8, max: 8 } }}
        zoom={{ scaleX: 1, scaleY: 1, xValue: chartData.length, yValue: 0 }} // Set initial view to end of data
      />
    </View>
  )
})

type ExercisesCoverageChartProps = {
  // data is a map of exercise category name to number of workouts
  chartData: {
    startTime: Date
    categories: {
      [category: string]: number
    }
  }[]
}

const ExercisesCoverageChart = observer(({ chartData }: ExercisesCoverageChartProps) => {
  const { themeStore } = useStores()

  const [range, setRange] = useState<"last7" | "last30" | "all">()
  const nowTm7 = sub(Date.now(), { weeks: 1 })
  const nowTm30 = sub(Date.now(), { months: 1 })

  const filteredChartData = chartData.filter((d) => {
    if (range === "last7") return d.startTime >= nowTm7
    if (range === "last30") return d.startTime >= nowTm30
    return true
  })
  const isEmpty = filteredChartData.length === 0
  const chartDataSummarized: { [category: string]: number } = filteredChartData.reduce((acc, d) => {
    Object.entries(d.categories).forEach(([cat, count]) => {
      acc[cat] = (acc[cat] || 0) + count
    })
    return acc
  }, {})

  const categories = Object.keys(chartDataSummarized) // To ensure consistent order of bars
  categories.sort((a, b) => chartDataSummarized[a] - chartDataSummarized[b]) // Sort by descending order of workouts count
  const drawLabelCutoffValue = Math.max(...Object.values(chartDataSummarized)) * 0.2 // Don't draw labels for values below this threshold

  const barChartdata = {
    dataSets: [
      {
        label: translate("profileScreen.dashboardWeeklyWorkoutsTitle"), // This is required but only affects legends
        values: categories.map((c, i) => ({
          x: i,
          y: chartDataSummarized[c],
          marker: "   " + chartDataSummarized[c], // The Marker component is styled poorly, so we add some padding
        })),
        config: {
          color: processColor(themeStore.colors("actionable")),
          valueTextColor: processColor(themeStore.colors("actionableForeground")),
          valueTextSize: 12,
          // Using "" for 0 to prevent from overlapping with x-axis labels
          valueFormatter: categories.map((c) =>
            chartDataSummarized[c] > drawLabelCutoffValue ? chartDataSummarized[c].toFixed(0) : "",
          ),
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
    valueFormatter: categories,
    position: "BOTTOM",
    drawLabels: true,
    drawGridLines: false,
    granularity: 1,
    granularityEnabled: true,
  }

  const yAxis = {
    left: {
      enabled: false,
      axisMinimum: 0,
    },
    right: {
      enabled: false,
    },
  }

  const marker = {
    enabled: true,
    textSize: 18,
    textColor: processColor(themeStore.colors("text")),
    markerColor: processColor(themeStore.colors("contentBackground")),
  }

  const onRangeButtonPress = (newRange: typeof range) => {
    setRange(newRange)
  }

  const $chartContainer: ViewStyle = {
    height: 300,
    justifyContent: "center",
  }

  return (
    <View style={styles.flex1}>
      <RowView style={[styles.alignCenter, styles.justifyBetween]}>
        <Text preset="subheading" tx="profileScreen.dashboardExercisesCoverageTitle" />
        <Popover trigger={<Info size={24} color={themeStore.colors("foreground")} />}>
          <Text tx="profileScreen.dashboardExercisesCoverageInfo" />
        </Popover>
      </RowView>
      <ButtonGroup
        buttons={[
          {
            tx: "profileScreen.dashboardExercisesCoverageAllTimeLabel",
            state: range === "all" ? "active" : "inactive",
            onPress: () => onRangeButtonPress("all"),
          },
          {
            tx: "profileScreen.dashboardExercisesCoverageLast30DaysLabel",
            state: range === "last30" ? "active" : "inactive",
            onPress: () => onRangeButtonPress("last30"),
          },
          {
            tx: "profileScreen.dashboardExercisesCoverageLast7DaysLabel",
            state: range === "last7" ? "active" : "inactive",
            onPress: () => onRangeButtonPress("last7"),
          },
        ]}
      />
      {isEmpty ? (
        <View style={$chartContainer}>
          <Text tx="profileScreen.dashboardExercisesCoverageNoDataMessage" />
        </View>
      ) : (
        <HorizontalBarChart
          // eslint-disable-next-line react-native/no-inline-styles
          style={$chartContainer}
          chartDescription={{ text: "" }}
          drawValueAboveBar={false}
          data={barChartdata}
          noDataText="No data"
          legend={legend}
          xAxis={xAxis}
          yAxis={yAxis}
          doubleTapToZoomEnabled={false}
          highlightPerDragEnabled={false}
          marker={marker}
        />
      )}
    </View>
  )
})

type DashboardTabSceneProps = {
  onScroll: ScrollViewProps["onScroll"]
}

const DashboardTabScene = observer((props: DashboardTabSceneProps) => {
  const { onScroll } = props

  const { feedStore, exerciseStore } = useStores()

  if (feedStore.isLoadingUserWorkouts) return <LoadingIndicator />
  if (feedStore.userWorkouts.length === 0)
    return (
      <View style={styles.fillAndCenter}>
        <Text tx="profileScreen.noActivityHistory" />
      </View>
    )

  // Prepare WeeklyWorkoutChart data
  const weeklyWorkoutData = [...feedStore.weeklyWorkoutsCount.entries()].map(
    ([weekStartDate, workoutsCount]) => ({
      weekStartDate,
      workoutsCount,
    }),
  )
  weeklyWorkoutData.sort((a, b) => a.weekStartDate - b.weekStartDate)

  // Prepare ExercisesCoverageChart data
  const exerciseCoverageData = feedStore.userWorkouts.map((w) => {
    const categories = w.exercises.reduce((acc, exercise) => {
      const cat = exerciseStore.getExerciseCategory(exercise.exerciseId)
      if (!cat) return acc

      acc[cat] = (acc[cat] || 0) + exercise.setsPerformed.length
      return acc
    }, {})

    return {
      startTime: w.startTime,
      categories,
    }
  })

  return (
    <ScrollView
      onScroll={onScroll}
      contentContainerStyle={{ gap: spacing.large }}
      showsVerticalScrollIndicator={false}
    >
      <WeeklyWorkoutChart chartData={weeklyWorkoutData} />
      <ExercisesCoverageChart chartData={exerciseCoverageData} />
      <Spacer type="vertical" size="listFooterPadding" />
    </ScrollView>
  )
})

export const ProfileScreen = observer(function ProfileScreen() {
  const mainNavigation = useMainNavigation()
  const { userStore, feedStore, activeWorkoutStore, themeStore } = useStores()

  // states
  const [tabIndex, setTabIndex] = useState(0)
  const statsBarFullHeight = useSharedValue(0)
  const statsBarHeight = useSharedValue(0)

  // derived states
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]

  // utilities
  const onLayoutUserProfileStatsBar = (e: LayoutChangeEvent) => {
    statsBarFullHeight.value = e.nativeEvent.layout.height
    statsBarHeight.value = e.nativeEvent.layout.height
  }

  const onContentScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y
    if (offset <= 0) {
      statsBarHeight.value = withTiming(statsBarFullHeight.value, { duration: 200 })
    } else if (offset > 50) {
      statsBarHeight.value = withTiming(0, { duration: 200 })
    }
  }

  useEffect(() => {
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
    activities: () => <UserActivitiesTabScene onScroll={onContentScroll} />,
    dashboard: () => <DashboardTabScene onScroll={onContentScroll} />,
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

  const $statsBarContainerAnimated = useAnimatedStyle(() => {
    return {
      height: statsBarHeight.value,
    }
  })

  const $tabViewContainer: ViewStyle = {
    flex: 1,
    backgroundColor: themeStore.colors("background"), // To overlay the stats bar
  }

  if (!userStore.user) return <LoadingScreen />

  return (
    <Screen
      safeAreaEdges={safeAreaEdges}
      contentContainerStyle={styles.tabScreenContainer}
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
          <Animated.View style={$statsBarContainerAnimated}>
            <UserProfileStatsBar
              onLayout={onLayoutUserProfileStatsBar}
              user={userStore.user}
              containerStyle={$userProfileStatsBar}
            />
          </Animated.View>
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

const $userAvatarRow: ViewStyle = {
  justifyContent: "space-between",
}

const $userProfileStatsBar: ViewStyle = {
  position: "absolute",
  width: "100%",
  paddingVertical: spacing.medium, // Use padding (internal property) instead of margin (external property) so we can animate the height
}

const $userDisplayName: ViewStyle = {
  marginLeft: spacing.small,
}
