import { useNavigation } from "@react-navigation/native"
import { Exercise, NewExercise } from "app/data/model"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import Toast from "react-native-root-toast"
import { Button, Picker, Screen, Spacer, Text, TextField } from "../../components"
import { MainStackScreenProps } from "../../navigators"

interface AddExerciseScreenProps extends MainStackScreenProps<"CreateExercise"> {}

export const CreateExerciseScreen: FC<AddExerciseScreenProps> = () => {
  const [activityName, setActivityName] = useState("")
  const [exerciseCat1, setExerciseCat1] = useState("")
  const [exerciseCat2, setExerciseCat2] = useState("")
  const [volumeType, setVolumeType] = useState("")
  const [exerciseName, setExerciseName] = useState("")
  const { exerciseStore } = useStores()
  const navigation = useNavigation()

  async function addExercise() {
    if (!activityName || !exerciseCat1 || !volumeType || !exerciseName) {
      Toast.show(translate("addExerciseScreen.requiredFieldsMissingMessage", { duration: 500 }))
      return
    }

    await exerciseStore.createPrivateExercise({
      activityName,
      exerciseCat1,
      exerciseCat2,
      exerciseName,
      volumeType,
    } as NewExercise)

    navigation.goBack()
  }

  function getDropdownValues(propName: keyof Exercise) {
    const dropdownValues = exerciseStore
      .getPropEnumValues(propName)
      .map((type) => {
        return { label: type, value: type }
      })
      .filter((dropdownValue) => dropdownValue.value !== "")
    dropdownValues.sort((a, b) => (a.label < b.label ? -1 : 1))
    return dropdownValues
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container} preset="auto">
      <Text tx="addExerciseScreen.disclaimer" preset="formHelper" />
      <Spacer type="vertical" size="massive" />
      <Picker
        selectedValue={activityName}
        onValueChange={setActivityName}
        labelTx="addExerciseScreen.activityType"
        itemsList={getDropdownValues("activityName")}
      />
      <Picker
        selectedValue={exerciseCat1}
        onValueChange={setExerciseCat1}
        labelTx="addExerciseScreen.exerciseCat1"
        itemsList={getDropdownValues("exerciseCat1")}
      />
      <Picker
        selectedValue={exerciseCat2}
        onValueChange={setExerciseCat2}
        labelTx="addExerciseScreen.exerciseCat2"
        itemsList={getDropdownValues("exerciseCat2")}
        clearSelectionPlaceholderTx="addExerciseScreen.setAsBlankLabel"
        clearSelectionCallback={() => setExerciseCat2("")}
      />
      <Picker
        selectedValue={volumeType}
        onValueChange={setVolumeType}
        labelTx="addExerciseScreen.volumeType"
        itemsList={getDropdownValues("volumeType")}
      />
      <TextField
        value={exerciseName}
        onChangeText={setExerciseName}
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
