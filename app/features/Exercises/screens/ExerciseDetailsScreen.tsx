import { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  ButtonGroup,
  Dropdown,
  Popover,
  RowView,
  Screen,
  Spacer,
  TabBar,
  Text,
} from "app/components"
import { ExerciseSource, ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { RepsPersonalRecord, WorkoutId } from "app/data/types"
import { LoadingScreen } from "app/features/common"
import { WorkoutSummaryCard } from "app/features/WorkoutSummary"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { IPersonalRecordsMapModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatDateTime } from "app/utils/formatDate"
import { roundToString } from "app/utils/formatNumber"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { add, differenceInDays } from "date-fns"
import { Info } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import {
  FlatList,
  Platform,
  processColor,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { LineChart } from "react-native-charts-wrapper"
import { SceneMap, TabView } from "react-native-tab-view"

const WorkoutHistoryTabScene = (exerciseId: string) =>
  observer(() => {
    const { userStore, feedStore } = useStores()
    const exerciseHistory = userStore.getPropAsJS<WorkoutId[]>(
      `user.exerciseHistory.${exerciseId}.performedWorkoutIds`,
    )

    if (!exerciseHistory || exerciseHistory?.length === 0)
      return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    function getWorkoutData() {
      const workouts = feedStore.userWorkouts.filter(({ workoutId }) => {
        return exerciseHistory.includes(workoutId)
      })
      workouts.sort((a, b) => (a.startTime > b.startTime ? -1 : 1))

      return workouts
    }

    function renderWorkoutItem({ item }) {
      if (!userStore.user) return null

      return (
        <WorkoutSummaryCard
          workoutId={item.workoutId}
          workout={item}
          byUser={userStore.user}
          highlightExerciseId={exerciseId}
        />
      )
    }

    return (
      <FlatList
        data={getWorkoutData()}
        renderItem={renderWorkoutItem}
        // ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
      />
    )
  })

const generatePerfOverTimeData = (
  personalRecords: Array<any>,
  recordField: string,
  dateField: string,
) => {
  const personalRecordsChartData = personalRecords
    .reduce((acc, pr) => {
      const _record = pr[recordField]
      const _datePerformed = pr[dateField]
      const _daysSinceZero = differenceInDays(_datePerformed, 0)

      // If a record already exists for the given date, keep the best one
      const findDate = acc.find((record) => record.xAxis === _daysSinceZero)
      if (findDate) {
        findDate.record = Math.max(findDate.record, _record) // Only keep the best record, this mutates the acc array
        return acc
      }

      // Otherwise, add a new record
      acc.push({
        record: _record,
        xAxis: _daysSinceZero,
      })
      return acc
    }, [] as { record: number; xAxis: number }[])
    .sort((a, b) => a.xAxis - b.xAxis)

  return personalRecordsChartData
}

const chartMarkerStringPadding = Platform.select({ ios: "   " }) ?? ""

type ExercisePerformanceChartProps = {
  /**
   * personalRecords is a map of time/reps (as string) to volume
   * e.g. { "10":}
   */
  personalRecords: { record: number; xAxis: number }[]
  xAxisType: "date" | "reps"
  yAxisType: "time" | "weight" | "reps"
  chartLegendLabel: string
  noDataText: string
  recordFormatter?: (record: number) => string
  // xAxisFormatter?: (volume: number) => string
}

const ExercisePerformanceChart = observer((props: ExercisePerformanceChartProps) => {
  const {
    personalRecords,
    xAxisType,
    yAxisType,
    chartLegendLabel,
    noDataText,
    recordFormatter,
    // xAxisFormatter,
  } = props

  const { themeStore } = useStores()

  const data = {
    dataSets: [
      {
        label: chartLegendLabel,
        values: personalRecords.map(({ record, xAxis }) => ({
          y: record,
          x: xAxis,
          // The Marker component is styled poorly, so we add some padding
          marker:
            chartMarkerStringPadding +
            (xAxisType === "date" ? formatDateTime(add(0, { days: xAxis }), "yyyy-MM-dd") : xAxis),
        })),
        config: {
          mode: "LINEAR", // LINEAR, HORIZONTAL_BEZIER, CUBIC_BEZIER
          valueFormatter: "labelByXValue",
          valueFormatterLabels: personalRecords.map(({ record, xAxis }) => ({
            label: recordFormatter ? recordFormatter(record) : record.toString(),
            x: xAxis,
          })),
          valueTextColor: processColor(themeStore.colors("actionable")),
          valueTextSize: 12,
          // highlightEnabled: false,
          drawVerticalHighlightIndicator: false,
          drawHorizontalHighlightIndicator: false,
          color: processColor(themeStore.colors("actionable")),
          circleColor: processColor(themeStore.colors("actionable")),
          circleRadius: 6,
          drawCircleHole: true,
          circleHoleColor: processColor(themeStore.colors("contentBackground")),
          lineWidth: 3, // Not documented
          // drawFilled: true,
          // fillColor: processColor("yellow"),
          // fillFormatter: {
          //   min: 100,
          // },
        },
      },
    ],
  }

  const legend = {
    enabled: false,
    textSize: 12,
    drawInside: false,
    horizontalAlignment: "RIGHT",
    verticalAlignment: "BOTTOM",
    form: "CIRCLE",
  }

  const xAxis: any = {
    textColor: processColor(themeStore.colors("text")),
    position: "BOTTOM",
    drawLabels: true,
    drawGridLines: true,
    granularityEnabled: true,
    // labelCount: 8,
    // labelCountForce: true,
    // limitLines: [
    //   {
    //     limit: 19837,
    //     label: "test limit",
    //     lineWidth: 3,
    //   },
    // ],
  }

  const minXValue = personalRecords.reduce((acc, { xAxis }) => Math.min(acc, xAxis), Infinity)
  const maxXValue = personalRecords.reduce((acc, { xAxis }) => Math.max(acc, xAxis), -Infinity)
  switch (xAxisType) {
    case "reps":
      xAxis.granularity = 1
      if (minXValue !== Infinity) xAxis.axisMinimum = minXValue - 0.5
      if (maxXValue !== -Infinity) xAxis.axisMaximum = maxXValue + 0.5
      break
    case "date":
      xAxis.granularity = 1
      // react-native-charts-wrapper does not support dynamic axis labels, they must be a fixed granularity
      // xAxis.valueFormatter = personalRecords.reduce((acc, { xAxis }) => {
      //   console.debug("valueFormatter", xAxis, formatDate(add(0, { days: xAxis })))
      //   acc[xAxis] = formatDate(add(0, { days: xAxis }))!
      //   return acc
      // }, [] as string[])
      xAxis.valueFormatter = "date"
      xAxis.since = 0
      xAxis.timeUnit = "DAYS"
      xAxis.valueFormatterPattern = "MM/dd"
      xAxis.labelRotationAngle = -45
      if (minXValue !== Infinity) xAxis.axisMinimum = minXValue - 7
      if (maxXValue !== -Infinity) xAxis.axisMaximum = maxXValue + 7
      break
  }

  const yAxis: any = {
    left: {
      textColor: processColor(themeStore.colors("text")),
      drawGridLines: false,
    },
    right: {
      enabled: false,
    },
  }

  switch (yAxisType) {
    case "time":
      yAxis.left.valueFormatter = "date"
      yAxis.left.valueFormatterPattern = "mm:ss"
      yAxis.left.timeUnit = "SECONDS"
      break
    case "reps":
      yAxis.left.granularity = 1
      yAxis.left.granularityEnabled = true
  }

  const marker = {
    enabled: true,
    textSize: 18,
    textColor: processColor(themeStore.colors("text")),
    markerColor: processColor(themeStore.colors("contentBackground")),
  }

  return (
    <LineChart
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ height: 300 }}
      data={data}
      legend={legend}
      xAxis={xAxis}
      yAxis={yAxis}
      marker={marker}
      noDataText={noDataText}
      doubleTapToZoomEnabled={false}
      chartDescription={{ text: "" }}
      maxVisibleValueCount={xAxisType === "date" ? 14 : undefined}
      // extraOffsets={{
      //   left: 0,
      //   top: 0,
      //   right: 20,
      //   bottom: 0,
      // }}
    />
  )
})

type IPersonalRecordsMapModelAsJS = Map<number, IPersonalRecordsMapModel>

const PersonalRecordsTabScene = (exerciseId: string) =>
  observer(() => {
    // hooks
    const { userStore, exerciseStore, feedStore, themeStore } = useStores()

    // states
    const weightUnitTx = useWeightUnitTx()
    const [prChartMode, setPrChartMode] = useState<"default" | "byWeight" | "byReps">("default")
    const [byWeightFilter, setByWeightFilter] = useState<number>(0)
    const [byRepsFilter, setByRepsFilter] = useState<number>(8)

    // derived states
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
    const exerciseHistory = userStore.getPropAsJS<WorkoutId[]>(
      `user.exerciseHistory.${exerciseId}.performedWorkoutIds`,
    )
    const personalRecordsMap = userStore.getPropAsJS<IPersonalRecordsMapModelAsJS>(
      `user.exerciseHistory.${exerciseId}.personalRecords`,
    )
    const personalRecords =
      personalRecordsMap &&
      personalRecordsMap.size > 0 &&
      Object.fromEntries(personalRecordsMap.entries()) // Quick fix to convert Map to Object
    const volumeType = exerciseStore.getExerciseVolumeType(exerciseId)
    const workouts = feedStore.userWorkouts.filter(({ workoutId }) => {
      return exerciseHistory?.includes(workoutId)
    })

    const renderTimePersonalRecords = (personalRecords: IPersonalRecordsMapModel) => {
      if (!personalRecords?.[0]) {
        return <Text tx="exerciseDetailsScreen.volumeTypeUpdatedMessage" preset="light" />
      }

      const sortedTimeRecords = personalRecords[0].records.sort((a, b) => b.time - a.time)

      // Prepare data for the chart
      const personalRecordsChartData = generatePerfOverTimeData(
        sortedTimeRecords,
        "time",
        "datePerformed",
      )

      return (
        <>
          <ExercisePerformanceChart
            personalRecords={personalRecordsChartData}
            xAxisType="date"
            yAxisType="time"
            chartLegendLabel={translate("volumeType.time")}
            noDataText={translate("exerciseDetailsScreen.noExerciseHistoryFound")}
            recordFormatter={(record) => formatSecondsAsTime(record)}
          />
          <Spacer type="vertical" size="small" />
          <RowView style={$recordItem}>
            <Text
              style={$recordsDateColumnHeader}
              preset="bold"
              tx="exerciseDetailsScreen.recordsHeaderDateLabel"
            />
            <Text style={$recordsTimeColumn} preset="bold">
              {translate("exerciseDetailsScreen.recordsHeaderTimeLabel")}
            </Text>
          </RowView>
          {sortedTimeRecords.map((record, i) => {
            const recordTime = formatSecondsAsTime(record.time)

            return (
              <RowView key={`${exerciseId}_${i}`} style={$recordItem}>
                <Text style={$recordsDateColumn}>{formatDateTime(record.datePerformed)}</Text>
                <Text style={$recordsTimeColumn}>{recordTime}</Text>
              </RowView>
            )
          })}
        </>
      )
    }

    const renderRepsPersonalRecords = (personalRecords: IPersonalRecordsMapModel) => {
      // Create a copy and and remove key 0 from personalRecords
      // to handle cases where the exercise volume type switch from "Time" to "Reps"
      const repsPersonalRecords = { ...personalRecords } as IPersonalRecordsMapModel
      delete repsPersonalRecords?.[0]
      if (!repsPersonalRecords || !Object.keys(repsPersonalRecords).length) {
        return <Text tx="exerciseDetailsScreen.volumeTypeUpdatedMessage" preset="light" />
      }

      // Prepare data for the personal best chart
      const personalRecordsChartData = Object.entries(repsPersonalRecords).map(
        ([reps, recordModel]) => {
          const recordsCount = recordModel.records.length
          const bestRecord = recordModel.records[recordsCount - 1] as RepsPersonalRecord
          const weight = new Weight(bestRecord.weight)

          return {
            record: weight.getWeightInUnit(userWeightUnit),
            xAxis: parseInt(reps),
          }
        },
      )

      // Prepare data for all time history
      const allTimeHistoryChartData = React.useMemo(() => {
        const allTimeHistoryChartData = {
          byWeight: {},
          byReps: {},
        } as {
          byWeight: {
            [weight: number]: {
              record: number // reps
              xAxis: number // datePerformed
            }[]
          }
          byReps: {
            [reps: number]: {
              record: number // weight
              xAxis: number // datePerformed
            }[]
          }
        }
        workouts.forEach((workout) => {
          const exercise = workout.exercises.find((exercise) => exercise.exerciseId === exerciseId)
          if (!exercise) return

          const byWeightBestReps = {}
          const byRepsBestWeight = {}
          exercise.setsPerformed.forEach((set) => {
            byWeightBestReps[set.weight ?? 0] = Math.max(
              byWeightBestReps[set.weight] ?? 0,
              set.reps,
            )
            byRepsBestWeight[set.reps] = Math.max(byRepsBestWeight[set.reps] ?? 0, set.weight)
          })

          Object.entries(byWeightBestReps).forEach(([weight, reps]) => {
            if (!allTimeHistoryChartData.byWeight[weight]) {
              allTimeHistoryChartData.byWeight[weight] = []
            }
            allTimeHistoryChartData.byWeight[weight].push({
              record: reps,
              xAxis: workout.startTime,
            })
          })

          Object.entries(byRepsBestWeight).forEach(([reps, _weight]) => {
            const weight = new Weight(_weight as number)

            if (!allTimeHistoryChartData.byReps[reps]) {
              allTimeHistoryChartData.byReps[reps] = []
            }
            allTimeHistoryChartData.byReps[reps].push({
              record: weight.getWeightInUnit(userWeightUnit),
              xAxis: workout.startTime,
            })
          })
        })

        // Clean up data (keep only the best record per date, because there might be multiple records per date)
        Object.entries(allTimeHistoryChartData.byWeight).forEach(([weight, records]) => {
          allTimeHistoryChartData.byWeight[weight] = generatePerfOverTimeData(
            records,
            "record",
            "xAxis",
          )
        })
        Object.entries(allTimeHistoryChartData.byReps).forEach(([reps, records]) => {
          allTimeHistoryChartData.byReps[reps] = generatePerfOverTimeData(
            records,
            "record",
            "xAxis",
          )
        })

        return allTimeHistoryChartData
      }, [workouts])

      // Get all weights and reps for the picker
      const weightPickerItems = Object.keys(allTimeHistoryChartData.byWeight)
        .map((_weight) => {
          const weight = new Weight(parseFloat(_weight))

          return {
            label: `${weight.getFormattedWeightInUnit(userWeightUnit, 1)} ${translate(
              weightUnitTx,
            )}`,
            value: parseFloat(_weight),
          }
        })
        .sort((a, b) => a.value - b.value)
      const repsPickerItems = Object.keys(allTimeHistoryChartData.byReps)
        .map((reps) => ({
          label: reps.toString(),
          value: parseInt(reps),
        }))
        .sort((a, b) => a.value - b.value)

      // Choose the appropriate chart to display
      let itemsLabel,
        itemsList,
        // pickerValue,
        setPickerValue,
        chartData,
        xAxisType,
        yAxisType,
        helpTextTx
      switch (prChartMode) {
        case "byWeight":
          itemsLabel = translate("exerciseDetailsScreen.performanceChartByWeightLabel")
          itemsList = weightPickerItems
          // pickerValue = byWeightFilter
          setPickerValue = setByWeightFilter
          chartData = allTimeHistoryChartData.byWeight[byWeightFilter] ?? []
          xAxisType = "date"
          yAxisType = "reps"
          helpTextTx = "exerciseDetailsScreen.performanceChartByWeightHelpText"
          break
        case "byReps":
          itemsLabel = translate("exerciseDetailsScreen.performanceChartByRepsLabel")
          itemsList = repsPickerItems
          // pickerValue = byRepsFilter
          setPickerValue = setByRepsFilter
          chartData = allTimeHistoryChartData.byReps[byRepsFilter] ?? []
          xAxisType = "date"
          yAxisType = "weight"
          helpTextTx = "exerciseDetailsScreen.performanceChartByRepsHelpText"
          break
        default:
          itemsList = [
            {
              label: translate("exerciseDetailsScreen.performanceChartDefaultLabel"),
              value: "",
            },
          ]
          chartData = personalRecordsChartData
          xAxisType = "reps"
          yAxisType = "weight"
          helpTextTx = "exerciseDetailsScreen.performanceChartDefaultHelpText"
          break
      }

      const pickerValue = React.useMemo(() => {
        console.debug("pickerValue useMemo triggered")
        switch (prChartMode) {
          case "byWeight":
            return byWeightFilter
          case "byReps":
            return byRepsFilter
          default:
            return ""
        }
      }, [prChartMode])

      React.useEffect(() => {
        if (prChartMode !== "default" && !pickerValue && itemsList.length) {
          setPickerValue(itemsList[0].value)
        }
      }, [prChartMode])

      return (
        <ScrollView>
          <RowView style={[styles.alignCenter, styles.justifyBetween]}>
            <Text tx="exerciseDetailsScreen.performanceChartTitle" preset="subheading" />
            <Popover trigger={<Info size={24} color={themeStore.colors("foreground")} />}>
              <Text tx={helpTextTx} />
            </Popover>
          </RowView>

          <ButtonGroup
            buttons={[
              {
                tx: "exerciseDetailsScreen.performanceChartDefaultLabel",
                state: prChartMode === "default" ? "active" : "inactive",
                onPress: () => setPrChartMode("default"),
              },
              {
                tx: "exerciseDetailsScreen.performanceChartByWeightLabel",
                state: prChartMode === "byWeight" ? "active" : "inactive",
                onPress: () => setPrChartMode("byWeight"),
              },
              {
                tx: "exerciseDetailsScreen.performanceChartByRepsLabel",
                state: prChartMode === "byReps" ? "active" : "inactive",
                onPress: () => setPrChartMode("byReps"),
              },
            ]}
          />

          <Dropdown
            status={!["byWeight", "byReps"].includes(prChartMode) ? "disabled" : undefined}
            selectedValue={pickerValue}
            onValueChange={setPickerValue}
            itemsList={itemsList}
            itemsLabel={itemsLabel}
          />
          <ExercisePerformanceChart
            key={prChartMode + "_chart"}
            personalRecords={chartData}
            xAxisType={xAxisType}
            yAxisType={yAxisType}
            chartLegendLabel={translate(weightUnitTx)}
            noDataText={translate("exerciseDetailsScreen.noExerciseHistoryFound")}
            recordFormatter={(record) => roundToString(record, 2, false)!}
          />

          <Spacer type="vertical" size="small" />
          <RowView style={$recordItem}>
            <Text
              style={$recordsDateColumnHeader}
              preset="bold"
              tx="exerciseDetailsScreen.recordsHeaderDateLabel"
            />
            <Text
              style={$recordsRepsColumn}
              preset="bold"
              tx="exerciseDetailsScreen.recordsHeaderRepsLabel"
            />
            <Text style={$recordsWeightColumn} preset="bold">
              {translate("exerciseDetailsScreen.recordsHeaderWeightLabel") +
                ` (${translate(weightUnitTx)})`}
            </Text>
          </RowView>
          {Object.entries(repsPersonalRecords).map(([reps, recordModel]) => {
            const recordsCount = recordModel.records.length
            const bestRecord = recordModel.records[recordsCount - 1] as RepsPersonalRecord
            const weight = new Weight(bestRecord.weight)

            return (
              <RowView key={`${exerciseId}_${reps}`} style={$recordItem}>
                <Text style={$recordsDateColumn}>{formatDateTime(bestRecord.datePerformed)}</Text>
                <Text style={$recordsRepsColumn}>{reps}</Text>
                <Text style={$recordsWeightColumn}>
                  {weight.getFormattedWeightInUnit(userWeightUnit, 1)}
                </Text>
              </RowView>
            )
          })}
        </ScrollView>
      )
    }

    const renderPersonalRecords = () => {
      if (!personalRecords) return null

      const sortedPersonalRecords = Object.fromEntries(
        Object.entries(personalRecords).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
      ) as any

      switch (volumeType) {
        case ExerciseVolumeType.Reps:
          return renderRepsPersonalRecords(sortedPersonalRecords)
        case ExerciseVolumeType.Time:
          return renderTimePersonalRecords(sortedPersonalRecords)
      }

      return null
    }

    if (!personalRecords) return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    return <View>{renderPersonalRecords()}</View>
  })

type ExerciseDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "ExerciseDetails">

export const ExerciseDetailsScreen = observer(({ route }: ExerciseDetailsScreenProps) => {
  const exerciseId = route.params.exerciseId

  // hooks
  const { themeStore, exerciseStore } = useStores()

  // states
  const [showEntireTitle, setShowEntireTitle] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  // derived states
  const exercise = exerciseStore.getExercise(exerciseId)

  if (exerciseStore.isLoading) return null

  const routes = [
    {
      key: "records",
      title: translate("exerciseDetailsScreen.personalRecordsLabel"),
    },
    {
      key: "history",
      title: translate("exerciseDetailsScreen.workoutHistoryLabel"),
    },
  ]

  // This is important to prevent unnecessary re-renders, and also to ensure Tamagui's Select components work
  // For undocumented reasons, Tamagui's Select components on Android does not work properly when mounted, unmounted, and re-mounted
  // See: https://github.com/tamagui/tamagui/issues/1595
  // See: https://github.com/tamagui/tamagui/issues/1859
  const tabBarSceneMap = React.useMemo(
    () => ({
      records: PersonalRecordsTabScene(exerciseId),
      history: WorkoutHistoryTabScene(exerciseId),
    }),
    [exerciseId],
  )

  const renderScene = SceneMap(tabBarSceneMap)

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

  const $isPrivateLabelContainer: ViewStyle = {
    alignItems: "center",
    padding: spacing.extraSmall,
    borderRadius: 8,
    backgroundColor: themeStore.colors("contentBackground"),
  }

  if (!exercise) return <LoadingScreen />

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={$screenContentContainer}>
      {exercise?.exerciseSource === ExerciseSource.Private && (
        <>
          <RowView style={$isPrivateLabelContainer}>
            <Info size={16} color={themeStore.colors("foreground")} />
            <Spacer type="horizontal" size="extraSmall" />
            <Text size="xxs" style={styles.flex1} tx="exerciseDetailsScreen.isPrivateLabel" />
          </RowView>
          <Spacer type="vertical" size="small" />
        </>
      )}
      <TouchableOpacity onPress={() => setShowEntireTitle((prev) => !prev)}>
        <Text preset="heading" numberOfLines={showEntireTitle ? undefined : 2}>
          {exercise?.exerciseName}
        </Text>
      </TouchableOpacity>
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setTabIndex}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}

const $recordsDateColumnHeader: ViewStyle & TextStyle = {
  flex: 2,
  textAlign: "center",
}

const $recordsDateColumn: ViewStyle & TextStyle = {
  flex: 2,
  textAlign: "center",
}

const $recordsWeightColumn: ViewStyle & TextStyle = {
  flex: 1,
  textAlign: "center",
}

const $recordsRepsColumn: ViewStyle & TextStyle = {
  flex: 1,
  textAlign: "center",
}

const $recordsTimeColumn: ViewStyle & TextStyle = {
  flex: 2,
  textAlign: "center",
}

const $recordItem: ViewStyle = {
  justifyContent: "space-between",
}
