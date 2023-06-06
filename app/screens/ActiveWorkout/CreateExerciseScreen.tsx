import { useNavigation } from "@react-navigation/native"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import { Button, Dropdown, Screen, TextField } from "../../components"
import { ActivityStackScreenProps } from "../../navigators"

interface AddExerciseScreenProps extends ActivityStackScreenProps<"CreateExercise"> {}

export const CreateExerciseScreen: FC<AddExerciseScreenProps> = () => {
  const [type, setType] = useState("")
  const [category, setCategory] = useState("")
  const [name, setName] = useState("")
  const { exerciseStore } = useStores()
  const navigation = useNavigation()

  const $container: ViewStyle = {
    padding: spacing.medium,
  }

  const $button: ViewStyle = {
    marginTop: spacing.extraLarge,
  }

  function selectType(value: string) {
    setType(value)
    console.debug(type)
  }

  function selectCategory(value: string) {
    setCategory(value)
    console.debug(category)
  }

  function addExercise() {
    console.debug("TODO: adding exercise")
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
