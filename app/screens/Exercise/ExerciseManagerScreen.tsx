import { Exercise } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
import { Icon, RowView, Screen, Spacer, Text } from "../../components"
import { TabScreenProps } from "../../navigators"
import { ExtendedEdge } from "../../utils/useSafeAreaInsetsStyle"
import { ExerciseCatalog } from "./ExerciseCatalog"

interface ExerciseManagerScreenProps extends TabScreenProps<"Exercises"> {}

export const ExerciseManagerScreen: FC<ExerciseManagerScreenProps> = observer(() => {
  const { workoutStore } = useStores()
  const mainNavigation = useMainNavigation()
  const safeAreaEdges: ExtendedEdge[] = workoutStore.inProgress ? [] : ["top"]

  function handleSelectExercise(exercise: Exercise) {
    mainNavigation.navigate("ExerciseDetails", { exerciseId: exercise.exerciseId })
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={$screenContainer}>
      <RowView style={[styles.alignCenter, styles.justifyBetween, $screenTitleContainer]}>
        <Text preset="screenTitle" tx="exerciseManagerScreen.exerciseManagerTitle" />
        <Icon
          name="create-outline"
          size={30}
          onPress={() => mainNavigation.navigate("CreateExercise")}
        />
      </RowView>
      <ExerciseCatalog
        onItemPress={handleSelectExercise}
        listFooterComponent={<Spacer type="vertical" size="extraLarge" />}
      />
    </Screen>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
}

const $screenTitleContainer: ViewStyle = {
  paddingTop: spacing.screenPadding,
  paddingLeft: spacing.screenPadding,
  paddingRight: spacing.screenPadding,
}
