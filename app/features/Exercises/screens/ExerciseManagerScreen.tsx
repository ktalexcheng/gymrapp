import { Icon, RowView, Screen, Spacer, Text } from "app/components"
import { TabScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExerciseModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
import { ExerciseCatalog } from "../components/ExerciseCatalog"

interface ExerciseManagerScreenProps extends TabScreenProps<"Exercises"> {}

export const ExerciseManagerScreen: FC<ExerciseManagerScreenProps> = observer(() => {
  const { activeWorkoutStore } = useStores()
  const mainNavigation = useMainNavigation()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]

  function handleSelectExercise(exercise: IExerciseModel) {
    mainNavigation.navigate("ExerciseDetails", { exerciseId: exercise.exerciseId })
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={styles.flex1}>
      <RowView style={[styles.alignCenter, styles.justifyBetween, $screenTitleContainer]}>
        <Text preset="screenTitle" tx="exerciseManagerScreen.exerciseManagerTitle" />
        <Spacer type="vertical" size="small" />
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

const $screenTitleContainer: ViewStyle = {
  paddingTop: spacing.screenPadding,
  paddingLeft: spacing.screenPadding,
  paddingRight: spacing.screenPadding,
}
