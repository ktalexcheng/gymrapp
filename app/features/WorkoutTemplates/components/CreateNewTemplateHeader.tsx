import { Button, RowView, TextField } from "app/components"
import { styles } from "app/theme"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"

type CreateNewTemplateHeaderProps = {
  workoutTitle: string
  onChangeWorkoutTitle: (workoutTitle: string) => void
  onSave: () => void
  onDiscard: () => void
}

export const CreateNewTemplateHeader = (props: CreateNewTemplateHeaderProps) => {
  const { workoutTitle, onChangeWorkoutTitle, onSave, onDiscard } = props

  return (
    <View>
      <RowView style={$workoutHeaderRow}>
        <Button preset="text" tx="common.discard" onPress={onDiscard} />

        <TextField
          selectTextOnFocus
          containerStyle={styles.flex4}
          inputWrapperStyle={$workoutTitleWrapper}
          style={$workoutTitle}
          value={workoutTitle}
          placeholderTx="workoutEditor.newWorkoutTitlePlaceholder"
          onChangeText={onChangeWorkoutTitle}
          autoCapitalize="sentences"
        />

        <Button tx="common.save" preset="text" onPress={onSave} />
      </RowView>
    </View>
  )
}

const $workoutHeaderRow: ViewStyle = {
  justifyContent: "space-between",
  alignItems: "center",
}

const $workoutTitleWrapper: TextStyle = {
  borderWidth: 0,
}

const $workoutTitle: TextStyle = {
  fontWeight: "bold",
  textAlign: "center",
}
