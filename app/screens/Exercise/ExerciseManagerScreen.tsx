import { Exercise } from "app/data/model"
import { colors } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { View, ViewStyle } from "react-native"
import { Fab, Icon } from "../../components"
import { MainStackScreenProps } from "../../navigators"
import { useSafeAreaInsetsStyle } from "../../utils/useSafeAreaInsetsStyle"
import { ExerciseCatalog } from "./ExerciseCatalog"

interface ExerciseManagerScreenProps extends MainStackScreenProps<"ExerciseManager"> {}

export const ExerciseManagerScreen: FC<ExerciseManagerScreenProps> = observer(({ navigation }) => {
  const $containerInsets = useSafeAreaInsetsStyle(["bottom", "left", "right"])

  function handleSelectExercise(exercise: Exercise) {
    navigation.navigate("ExerciseDetails", { exerciseId: exercise.exerciseId })
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <View style={[$screenContainer, $containerInsets]}>
      <Fab
        size="lg"
        icon={<Icon color="white" name="add-outline" size={30} />}
        position="bottomRight"
        backgroundColor={colors.actionable}
        onPress={() => navigation.navigate("CreateExercise")}
      />
      <ExerciseCatalog onItemPress={handleSelectExercise} />
    </View>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
}
