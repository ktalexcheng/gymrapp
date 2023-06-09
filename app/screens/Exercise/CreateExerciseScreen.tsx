import { useNavigation } from "@react-navigation/native"
import { NewExercise } from "app/data/model"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import { Button, Dropdown, Screen, TextField } from "../../components"
import { MainStackScreenProps } from "../../navigators"

interface AddExerciseScreenProps extends MainStackScreenProps<"CreateExercise"> {}

export const CreateExerciseScreen: FC<AddExerciseScreenProps> = () => {
  const [type, setType] = useState("")
  const [subtype, setSubtype] = useState("")
  const [category, setCategory] = useState("")
  const [name, setName] = useState("")
  const { exerciseStore } = useStores()
  const navigation = useNavigation()

  function selectType(value: string) {
    setType(value)
  }

  function selectSubtype(value: string) {
    setSubtype(value)
  }

  function selectCategory(value: string) {
    setCategory(value)
  }

  function addExercise() {
    exerciseStore.createNewExercise({
      exerciseType: type,
      exerciseCategory: category,
      exerciseSubtype: subtype,
      exerciseName: name,
    } as NewExercise)
    navigation.goBack()
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <Dropdown
        onValueChange={selectType}
        labelTx="addExerciseScreen.exerciseType"
        itemsList={exerciseStore.allExerciseTypes.map((type) => {
          return { label: type, value: type }
        })}
      />
      <Dropdown
        onValueChange={selectSubtype}
        labelTx="addExerciseScreen.exerciseSubtype"
        itemsList={exerciseStore.allExerciseSubtypes.map((subtype) => {
          return { label: subtype, value: subtype }
        })}
      />
      <Dropdown
        onValueChange={selectCategory}
        labelTx="addExerciseScreen.exerciseCategory"
        itemsList={exerciseStore.allExerciseCategories.map((category) => {
          return { label: category, value: category }
        })}
      />
      <TextField onChangeText={setName} value={name} labelTx="addExerciseScreen.exerciseName" />
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
