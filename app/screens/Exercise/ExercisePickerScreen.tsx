import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
import { Fab, Icon, Screen } from "../../components"
import { MainStackScreenProps } from "../../navigators"
import { IExerciseModel, useStores } from "../../stores"
import { ExerciseCatalog } from "./ExerciseCatalog"

interface ExercisePickerScreenProps extends MainStackScreenProps<"ExercisePicker"> {}

export const ExercisePickerScreen: FC<ExercisePickerScreenProps> = observer(
  ({ navigation, route }) => {
    const { activeWorkoutStore, workoutEditorStore, themeStore } = useStores()
    const workoutStore = route.params.mode === "active" ? activeWorkoutStore : workoutEditorStore

    function handleSelectExercise(exercise: IExerciseModel) {
      workoutStore.addExercise(exercise)
      navigation.goBack()
    }

    return (
      // Note that tab press does not work properly when a debugger is attached
      // See: https://github.com/satya164/react-native-tab-view/issues/703
      <Screen safeAreaEdges={["bottom"]} contentContainerStyle={[$screenContainer]}>
        <Fab
          size="lg"
          icon={
            <Icon color={themeStore.colors("actionableForeground")} name="add-outline" size={30} />
          }
          position="bottomRight"
          backgroundColor={themeStore.colors("actionable")}
          onPress={() => navigation.navigate("CreateExercise")}
        />
        <ExerciseCatalog onItemPress={handleSelectExercise} />
      </Screen>
    )
  },
)

const $screenContainer: ViewStyle = {
  flex: 1,
}
