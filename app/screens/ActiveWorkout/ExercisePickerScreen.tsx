import { colors } from "app/theme"
import { observer } from "mobx-react-lite"
import { Fab } from "native-base"
import React, { FC } from "react"
import { ViewStyle } from "react-native"
import { Icon, Screen } from "../../components"
import { MainStackScreenProps } from "../../navigators"
import { useStores } from "../../stores"
import { ExerciseCatalog } from "../Exercise"

interface ExercisePickerScreenProps extends MainStackScreenProps<"ExercisePicker"> {}

export const ExercisePickerScreen: FC<ExercisePickerScreenProps> = observer(({ navigation }) => {
  const { workoutStore } = useStores()

  function handleSelectExercise(exerciseId: string) {
    workoutStore.addExercise(exerciseId)
    navigation.goBack()
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <Screen safeAreaEdges={["bottom", "left", "right"]} contentContainerStyle={[$screenContainer]}>
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon color="white" name="add-outline" size={30} />}
        backgroundColor={colors.actionable}
        onPress={() => navigation.navigate("CreateExercise")}
      />
      <ExerciseCatalog onItemPress={handleSelectExercise} />
    </Screen>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
}
