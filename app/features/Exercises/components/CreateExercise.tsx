import {
  Button,
  Divider,
  MenuListItem,
  MenuListItemProps,
  Picker,
  Spacer,
  Text,
  TextField,
} from "app/components"
import { Exercise, NewExercise } from "app/data/types"
import { useInternetStatus, useToast } from "app/hooks"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { useState } from "react"
import { Alert, View, ViewStyle } from "react-native"

type CreateExerciseProps = {
  onCreateSuccess: () => void
}

export const CreateExercise = (props: CreateExerciseProps) => {
  const { onCreateSuccess } = props

  const { exerciseStore } = useStores()
  const [toastShowTx] = useToast()
  const [isInternetConnected] = useInternetStatus()

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

  const [activityName, setActivityName] = useState(getDropdownValues("activityName")[0].value)
  const [exerciseCat1, setExerciseCat1] = useState(getDropdownValues("exerciseCat1")[0].value)
  const [exerciseCat2, setExerciseCat2] = useState(getDropdownValues("exerciseCat2")[0].value)
  const [volumeType, setVolumeType] = useState(getDropdownValues("volumeType")[0].value)
  const [exerciseName, setExerciseName] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  function doAddExercise() {
    setIsBusy(true)
    exerciseStore
      .createPrivateExercise(
        {
          activityName,
          exerciseCat1,
          exerciseCat2,
          exerciseName,
          volumeType,
        } as NewExercise,
        !isInternetConnected,
      )
      .then(() => {
        toastShowTx("createExerciseScreen.createExerciseSuccessfulMessage")
        onCreateSuccess()
      })
      .finally(() => setIsBusy(false))
  }

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

    console.debug(
      "CreateExerciseScreen.addExercise: isExerciseNameUnique",
      exerciseStore.isExerciseNameUnique(exerciseName),
    )
    if (!exerciseStore.isExerciseNameUnique(exerciseName)) {
      Alert.alert(
        translate("createExerciseScreen.exerciseAlreadyExistsTitle"),
        translate("createExerciseScreen.exerciseAlreadyExistsMessage"),
        [
          {
            text: translate("common.yes"),
            onPress: doAddExercise,
          },
          {
            text: translate("common.no"),
          },
        ],
      )
    } else {
      doAddExercise()
    }
  }

  const newExerciseFormData: MenuListItemProps[] = [
    {
      required: true,
      id: "exerciseName",
      itemNameLabelTx: "createExerciseScreen.exerciseName",
      currentValue: exerciseName,
      currentValueFormatted: exerciseName,
      onValueChange: setExerciseName,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <TextField
          value={selectedValue}
          onChangeText={onSelectionChange}
          labelTx="createExerciseScreen.exerciseName"
        />
      ),
    },
    {
      required: true,
      id: "activityName",
      itemNameLabelTx: "createExerciseScreen.activityType",
      currentValue: activityName,
      currentValueFormatted: activityName,
      onValueChange: setActivityName,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="createExerciseScreen.activityType"
          itemsList={getDropdownValues("activityName")}
          selectedValue={selectedValue}
        />
      ),
    },
    {
      required: true,
      id: "exerciseCat1",
      itemNameLabelTx: "createExerciseScreen.exerciseCat1",
      currentValue: exerciseCat1,
      currentValueFormatted: exerciseCat1,
      onValueChange: setExerciseCat1,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="createExerciseScreen.exerciseCat1"
          itemsList={getDropdownValues("exerciseCat1")}
          selectedValue={selectedValue}
        />
      ),
    },
    {
      id: "exerciseCat2",
      itemNameLabelTx: "createExerciseScreen.exerciseCat2",
      currentValue: exerciseCat2,
      currentValueFormatted: exerciseCat2,
      onValueChange: setExerciseCat2,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="createExerciseScreen.exerciseCat2"
          itemsList={getDropdownValues("exerciseCat2")}
          selectedValue={selectedValue}
          clearSelectionPlaceholderTx="createExerciseScreen.setAsBlankLabel"
          clearSelectionCallback={() => setExerciseCat2("")}
        />
      ),
    },
    {
      required: true,
      id: "volumeType",
      itemNameLabelTx: "createExerciseScreen.volumeType",
      currentValue: volumeType,
      currentValueFormatted: volumeType,
      onValueChange: setVolumeType,
      PickerComponent: ({ selectedValue, onSelectionChange }) => (
        <Picker
          androidPickerMode="dropdown"
          onValueChange={onSelectionChange}
          labelTx="createExerciseScreen.volumeType"
          itemsList={getDropdownValues("volumeType")}
          selectedValue={selectedValue}
        />
      ),
    },
  ]

  return (
    <View>
      <Text tx="createExerciseScreen.disclaimer" preset="formHelper" />
      <Spacer type="vertical" size="massive" />
      {newExerciseFormData.map((exerciseDetails, i) => {
        return (
          <View key={exerciseDetails.id}>
            {i > 0 && <Divider orientation="horizontal" spaceSize={12} lineWidth={0} />}
            <MenuListItem {...exerciseDetails} />
          </View>
        )
      })}
      <Spacer type="vertical" size="extraLarge" />
      <Button
        isBusy={isBusy}
        tx="createExerciseScreen.createExerciseButton"
        style={$button}
        onPress={addExercise}
      />
    </View>
  )
}

const $button: ViewStyle = {
  marginTop: spacing.extraLarge,
}
