import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "app/components"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { Text, ViewStyle } from "react-native"

type ExerciseDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "ExerciseDetails">

export const ExerciseDetailsScreen: FC = observer(({ route }: ExerciseDetailsScreenProps) => {
  const { exerciseStore } = useStores()
  const exercise = exerciseStore.allExercises.get(route.params.exerciseId)

  return (
    <Screen safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text>{exercise.exerciseName}</Text>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
