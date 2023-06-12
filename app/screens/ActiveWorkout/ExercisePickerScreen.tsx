import { colors } from "app/theme"
import { observer } from "mobx-react-lite"
import { Fab } from "native-base"
import React, { FC } from "react"
import { View, ViewStyle } from "react-native"
import { Icon } from "../../components"
import { MainStackScreenProps } from "../../navigators"
import { useStores } from "../../stores"
import { useSafeAreaInsetsStyle } from "../../utils/useSafeAreaInsetsStyle"
import { ExerciseCatalog } from "../Exercise"

interface ExercisePickerScreenProps extends MainStackScreenProps<"ExercisePicker"> {}

export const ExercisePickerScreen: FC<ExercisePickerScreenProps> = observer(({ navigation }) => {
  const { workoutStore } = useStores()
  const $containerInsets = useSafeAreaInsetsStyle(["bottom", "left", "right"])

  function handleSelectExercise(exerciseId: string) {
    workoutStore.addExercise(exerciseId)
    navigation.goBack()
  }

  return (
    // Note that tab press does not work properly when a debugger is attached
    // See: https://github.com/satya164/react-native-tab-view/issues/703
    <View style={[$screenContainer, $containerInsets]}>
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon color="white" name="add-outline" size={30} />}
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
