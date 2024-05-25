import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RowView, Screen, TabBar, Text } from "app/components"
import { ExerciseVolumeType, WeightUnit, WorkoutSource } from "app/data/constants"
import { RepsPersonalRecord, WorkoutId } from "app/data/types"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { IPersonalRecordsMapModel, useStores } from "app/stores"
import { spacing } from "app/theme"
import { formatDate } from "app/utils/formatDate"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

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
        // ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
      />
    )
  })

type IPersonalRecordsMapModelAsJS = Map<number, IPersonalRecordsMapModel>

const PersonalRecordsTabScene = (exerciseId: string) =>
  observer(() => {
    const { userStore, exerciseStore } = useStores()
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
    const weightUnitTx = useWeightUnitTx()
    const personalRecordsMap = userStore.getPropAsJS<IPersonalRecordsMapModelAsJS>(
      `user.exerciseHistory.${exerciseId}.personalRecords`,
    )
    const personalRecords =
      personalRecordsMap &&
      personalRecordsMap.size > 0 &&
      Object.fromEntries(personalRecordsMap.entries()) // Quick fix to convert Map to Object
    const volumeType = exerciseStore.getExerciseVolumeType(exerciseId)

    const renderTimePersonalRecords = (personalRecords: IPersonalRecordsMapModel) => {
      if (!personalRecords?.[0]) {
        return <Text tx="exerciseDetailsScreen.volumeTypeUpdatedMessage" preset="light" />
      }

      const sortedTimeRecords = personalRecords[0].records.sort((a, b) => b.time - a.time)

      return (
        <>
          <RowView style={$recordItem}>
            <Text
              style={$recordsDateColumn}
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
                <Text style={$recordsDateColumn}>{formatDate(record.datePerformed)}</Text>
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

      return (
        <>
          <RowView style={$recordItem}>
            <Text
              style={$recordsDateColumn}
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
                <Text style={$recordsDateColumn}>{formatDate(bestRecord.datePerformed)}</Text>
                <Text style={$recordsRepsColumn}>{reps}</Text>
                <Text style={$recordsWeightColumn}>
                  {weight.getFormattedWeightInUnit(userWeightUnit, 1)}
                </Text>
              </RowView>
            )
          })}
        </>
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

    return (
      <View>
        {/* <RowView style={$recordItem}>
          <Text
            style={$recordsDateColumn}
            preset="bold"
            tx="exerciseDetailsScreen.recordsHeaderDateLabel"
          />
          {renderHeaders()}
        </RowView> */}
        {renderPersonalRecords()}
      </View>
    )
  })

type ExerciseDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "ExerciseDetails">

export const ExerciseDetailsScreen = observer(({ route }: ExerciseDetailsScreenProps) => {
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
    return <TabBar tabIndex={tabIndex} setTabIndex={setTabIndex} {...props} />
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
