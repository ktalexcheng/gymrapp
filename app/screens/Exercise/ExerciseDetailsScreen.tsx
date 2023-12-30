import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { ExerciseVolumeType, WeightUnit, WorkoutSource } from "app/data/constants"
import { ExerciseRecord, RepsPersonalRecord, TimePersonalRecord, WorkoutId } from "app/data/model"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { formatDate } from "app/utils/formatDate"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

const WorkoutHistoryTabScene = (exerciseId: string) =>
  observer(() => {
    const { userStore, feedStore } = useStores()
    // const exerciseHistory = userStore.user?.exerciseHistory?.[exerciseId]?.performedWorkoutIds
    const exerciseHistory = userStore.getProp<WorkoutId[]>(
      `user.exerciseHistory.${exerciseId}.performedWorkoutIds`,
    )

    if (!exerciseHistory) return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    function getWorkoutData() {
      const workouts = Array.from(feedStore.userWorkouts.values())
        .filter(({ workoutId }) => {
          return exerciseHistory.includes(workoutId)
        })
        .map(({ workout }) => workout)
      workouts.sort((a, b) => (a.startTime > b.startTime ? -1 : 1))

      return workouts
    }

    function renderWorkoutItem({ item }) {
      return (
        <WorkoutSummaryCard
          workoutSource={WorkoutSource.User}
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
        ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
      />
    )
  })

const PersonalRecordsTabScene = (exerciseId: string) =>
  observer(() => {
    const { userStore, exerciseStore } = useStores()
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
    const weightUnitTx = useWeightUnitTx()
    // const personalRecords = userStore.user?.exerciseHistory?.[exerciseId]
    //   ?.personalRecords as ExerciseRecord
    const personalRecords = userStore.getProp<ExerciseRecord>(
      `user.exerciseHistory.${exerciseId}.personalRecords`,
    )
    const volumeType = exerciseStore.getExerciseVolumeType(exerciseId)

    const renderTimePersonalRecords = (personalRecords: ExerciseRecord) => {
      const sortedTimeRecords = (personalRecords[0] as TimePersonalRecord[]).sort(
        (a, b) => b.time - a.time,
      )

      return sortedTimeRecords.map((record, i) => {
        const recordTime = formatSecondsAsTime(record.time)

        return (
          <RowView key={`${exerciseId}_${i}`} style={$recordItem}>
            <Text style={$recordsDateColumn}>{formatDate(record.datePerformed)}</Text>
            <Text style={$recordsTimeColumn}>{recordTime}</Text>
          </RowView>
        )
      })
    }

    const renderRepsPersonalRecords = (personalRecords: ExerciseRecord) => {
      return Object.entries(personalRecords).map(([reps, records]) => {
        const recordsCount = records.length
        const bestRecord = records[recordsCount - 1] as RepsPersonalRecord
        const weight = new Weight(bestRecord.weight, WeightUnit.kg, userWeightUnit)

        return (
          <RowView key={`${exerciseId}_${reps}`} style={$recordItem}>
            <Text style={$recordsDateColumn}>{formatDate(bestRecord.datePerformed)}</Text>
            <Text style={$recordsRepsColumn}>{reps}</Text>
            <Text style={$recordsWeightColumn}>{weight.formattedDisplayWeight(1, true)}</Text>
          </RowView>
        )
      })
    }

    const renderPersonalRecords = () => {
      const sortedPersonalRecords = Object.fromEntries(
        Object.entries(personalRecords).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
      ) as ExerciseRecord

      switch (volumeType) {
        case ExerciseVolumeType.Reps:
          return renderRepsPersonalRecords(sortedPersonalRecords)
        case ExerciseVolumeType.Time:
          return renderTimePersonalRecords(sortedPersonalRecords)
      }
    }

    const renderHeaders = () => {
      switch (volumeType) {
        case ExerciseVolumeType.Reps:
          return (
            <>
              <Text
                style={$recordsRepsColumn}
                preset="bold"
                tx="exerciseDetailsScreen.recordsHeaderRepsLabel"
              />
              <Text style={$recordsWeightColumn} preset="bold">
                {translate("exerciseDetailsScreen.recordsHeaderWeightLabel") +
                  ` (${translate(weightUnitTx)})`}
              </Text>
            </>
          )
        case ExerciseVolumeType.Time:
          return (
            <Text style={$recordsTimeColumn} preset="bold">
              {translate("exerciseDetailsScreen.recordsHeaderTimeLabel")}
            </Text>
          )
      }
    }

    if (!personalRecords) return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    return (
      <View>
        <RowView style={$recordItem}>
          <Text
            style={$recordsDateColumn}
            preset="bold"
            tx="exerciseDetailsScreen.recordsHeaderDateLabel"
          />
          {renderHeaders()}
        </RowView>
        {renderPersonalRecords()}
      </View>
    )
  })

type ExerciseDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "ExerciseDetails">

export const ExerciseDetailsScreen: FC = observer(({ route }: ExerciseDetailsScreenProps) => {
  const exerciseId = route.params.exerciseId
  const { exerciseStore } = useStores()
  const exerciseName = exerciseStore.getExerciseName(exerciseId)
  const [tabIndex, setTabIndex] = useState(0)

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

  const renderScene = SceneMap({
    records: PersonalRecordsTabScene(exerciseId),
    history: WorkoutHistoryTabScene(exerciseId),
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

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={$screenContentContainer}>
      <Text preset="heading">{exerciseName}</Text>
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
