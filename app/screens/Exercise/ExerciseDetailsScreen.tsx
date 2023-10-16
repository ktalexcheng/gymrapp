import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RowView, Screen, Spacer, TabBar, Text } from "app/components"
import { WeightUnit } from "app/data/constants"
import { ExerciseRecord, WorkoutId } from "app/data/model"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"
import { SceneMap, TabView } from "react-native-tab-view"
import { WorkoutSummaryCard } from "../FinishedWorkout"

const WorkoutHistoryTabScene = (exerciseId: string) =>
  observer(() => {
    const { userStore } = useStores()
    // const exerciseHistory = userStore.user?.exerciseHistory?.[exerciseId]?.performedWorkoutIds
    const exerciseHistory = userStore.getProp<WorkoutId[]>(
      `user.exerciseHistory.${exerciseId}.performedWorkoutIds`,
    )

    if (!exerciseHistory) return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    function getWorkoutData() {
      const workouts = Array.from(userStore.workouts.values()).filter(({ workoutId }) => {
        return exerciseHistory.includes(workoutId)
      })
      workouts.sort((a, b) => (a.workout.startTime > b.workout.startTime ? -1 : 1))

      return workouts
    }

    function renderWorkoutItem({ item }) {
      return <WorkoutSummaryCard {...item} highlightExerciseId={exerciseId} />
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
    const { userStore } = useStores()
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
    const weightUnitTx = useWeightUnitTx()
    // const personalRecords = userStore.user?.exerciseHistory?.[exerciseId]
    //   ?.personalRecords as ExerciseRecord
    const personalRecords = userStore.getProp<ExerciseRecord>(
      `user.exerciseHistory.${exerciseId}.personalRecords`,
    )

    if (!personalRecords) return <Text tx="exerciseDetailsScreen.noExerciseHistoryFound" />

    const sortedPersonalRecords = Object.fromEntries(
      Object.entries(personalRecords).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
    ) as ExerciseRecord

    return (
      <View>
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
        {Object.entries(sortedPersonalRecords).map(([reps, records]) => {
          const recordsCount = records.length
          const bestRecord = records[recordsCount - 1]
          const weight = new Weight(bestRecord.weight, WeightUnit.kg, userWeightUnit)

          return (
            <RowView key={`${exerciseId}_${reps}`} style={$recordItem}>
              <Text style={$recordsDateColumn}>{bestRecord.datePerformed.toLocaleString()}</Text>
              <Text style={$recordsRepsColumn}>{reps}</Text>
              <Text style={$recordsWeightColumn}>{weight.formattedDisplayWeight(1, true)}</Text>
            </RowView>
          )
        })}
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

const $recordItem: ViewStyle = {
  justifyContent: "space-between",
}
