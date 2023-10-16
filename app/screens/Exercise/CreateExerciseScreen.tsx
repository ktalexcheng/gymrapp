import { useNavigation } from "@react-navigation/native"
import { NewExercise } from "app/data/model"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import { Button, Dropdown, Screen, Spacer, Text, TextField } from "../../components"
import { MainStackScreenProps } from "../../navigators"

interface AddExerciseScreenProps extends MainStackScreenProps<"CreateExercise"> {}

export const CreateExerciseScreen: FC<AddExerciseScreenProps> = () => {
  const [activityName, setActivityName] = useState("")
  const [exerciseCat1, setExerciseCat1] = useState("")
  const [exerciseCat2, setExerciseCat2] = useState("")
  const [exerciseName, setExerciseName] = useState("")
  const { exerciseStore } = useStores()
  const navigation = useNavigation()

  function selectType(value: string) {
    setActivityName(value)
  }

  function selectSubtype(value: string) {
    setExerciseCat1(value)
  }

  function selectCategory(value: string) {
    setExerciseCat2(value)
  }

  function addExercise() {
    exerciseStore.createPrivateExercise({
      activityName,
      exerciseCat1,
      exerciseCat2,
      exerciseName,
    } as NewExercise)
    navigation.goBack()
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <Text tx="addExerciseScreen.disclaimer" preset="formHelper" />
      <Spacer type="vertical" size="massive" />
      <Dropdown
        size="md"
        onValueChange={selectType}
        labelTx="addExerciseScreen.activityName"
        itemsList={exerciseStore.allExerciseTypes.map((type) => {
          return { label: type, value: type }
        })}
      />
      <Dropdown
        size="md"
        onValueChange={selectSubtype}
        labelTx="addExerciseScreen.exerciseCategory"
        itemsList={exerciseStore.allExerciseSubtypes.map((subtype) => {
          return { label: subtype, value: subtype }
        })}
      />
      <Dropdown
        size="md"
        onValueChange={selectCategory}
        labelTx="addExerciseScreen.exerciseSubCategory"
        itemsList={exerciseStore.allExerciseCategories.map((category) => {
          return { label: category, value: category }
        })}
      />
      <TextField
        onChangeText={setExerciseName}
        value={exerciseName}
        labelTx="addExerciseScreen.exerciseName"
      />
      <Button tx="addExerciseScreen.addExerciseButton" style={$button} onPress={addExercise} />
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.medium,
}

const $button: ViewStyle = {
  marginTop: spacing.extraLarge,
}
