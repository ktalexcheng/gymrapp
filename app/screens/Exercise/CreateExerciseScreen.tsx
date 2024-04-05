import { useNavigation } from "@react-navigation/native"
import { Exercise, NewExercise } from "app/data/types"
import { useInternetStatus, useToast } from "app/hooks"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import { Button, Picker, Screen, Spacer, Text, TextField } from "../../components"
import { MainStackScreenProps } from "../../navigators"

interface CreateExerciseScreenProps extends MainStackScreenProps<"CreateExercise"> {}

export const CreateExerciseScreen: FC<CreateExerciseScreenProps> = () => {
  const [activityName, setActivityName] = useState("")
  const [exerciseCat1, setExerciseCat1] = useState("")
  const [exerciseCat2, setExerciseCat2] = useState("")
  const [volumeType, setVolumeType] = useState("")
  const [exerciseName, setExerciseName] = useState("")
  const { exerciseStore } = useStores()
  const navigation = useNavigation()
  const [toastShowTx] = useToast()
  const [isInternetConnected] = useInternetStatus()

  async function addExercise() {
    console.debug("CreateExerciseScreen.addExercise:", {
      activityName,
      exerciseCat1,
      volumeType,
      exerciseName,
    })
    if (!activityName || !exerciseCat1 || !volumeType || !exerciseName) {
      toastShowTx("createExerciseScreen.requiredFieldsMissingMessage")
      return
    }

    await exerciseStore.createPrivateExercise(
      {
        activityName,
        exerciseCat1,
        exerciseCat2,
        exerciseName,
        volumeType,
      } as NewExercise,
      !isInternetConnected,
    )

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

  useEffect(() => {
    setActivityName(getDropdownValues("activityName")[0].value)
    setExerciseCat1(getDropdownValues("exerciseCat1")[0].value)
    setExerciseCat2(getDropdownValues("exerciseCat2")[0].value)
    setVolumeType(getDropdownValues("volumeType")[0].value)
  }, [])

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container} preset="auto">
      <Text tx="createExerciseScreen.createExerciseTitle" preset="heading" />
      <Text tx="createExerciseScreen.disclaimer" preset="formHelper" />
      <Spacer type="vertical" size="massive" />
      <Picker
        selectedValue={activityName}
        onValueChange={setActivityName}
        labelTx="createExerciseScreen.activityType"
        itemsList={getDropdownValues("activityName")}
      />
      <Picker
        selectedValue={exerciseCat1}
        onValueChange={setExerciseCat1}
        labelTx="createExerciseScreen.exerciseCat1"
        itemsList={getDropdownValues("exerciseCat1")}
      />
      <Picker
        selectedValue={exerciseCat2}
        onValueChange={(value) => setExerciseCat2(value ?? "")}
        labelTx="createExerciseScreen.exerciseCat2"
        itemsList={getDropdownValues("exerciseCat2")}
        clearSelectionPlaceholderTx="createExerciseScreen.setAsBlankLabel"
        clearSelectionCallback={() => setExerciseCat2("")}
      />
      <Picker
        selectedValue={volumeType}
        onValueChange={setVolumeType}
        labelTx="createExerciseScreen.volumeType"
        itemsList={getDropdownValues("volumeType")}
      />
      <TextField
        value={exerciseName}
        onChangeText={setExerciseName}
        labelTx="createExerciseScreen.exerciseName"
      />
      <Button tx="createExerciseScreen.addExerciseButton" style={$button} onPress={addExercise} />
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.medium,
}

const $button: ViewStyle = {
  marginTop: spacing.extraLarge,
}
