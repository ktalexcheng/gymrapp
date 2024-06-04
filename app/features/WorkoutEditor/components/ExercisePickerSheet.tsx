import { Button, RowView, Sheet, Text } from "app/components"
import { ExerciseCatalog } from "app/features/Exercises"
import { IExerciseModel } from "app/stores"
import { spacing } from "app/theme"
import React, { memo } from "react"
import { ViewStyle } from "react-native"

type ExercisePickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemPress: (exercise: IExerciseModel) => void
}

export const ExercisePickerSheet = memo(function ExercisePickerSheet(
  props: ExercisePickerSheetProps,
) {
  const { open, onOpenChange, onItemPress } = props

  const handleOnItemPress = (exercise: IExerciseModel) => {
    onOpenChange(false)
    onItemPress(exercise)
  }

  console.debug("ExercisePickerSheet rendering")
  return (
    <Sheet forceRemoveScrollEnabled={open} open={open} onOpenChange={onOpenChange}>
      <RowView style={$panelHeader}>
        <Text preset="subheading" tx="exerciseManagerScreen.exerciseManagerTitle" />
        <Button preset="text" tx="common.cancel" onPress={() => onOpenChange(false)} />
      </RowView>

      <ExerciseCatalog onItemPress={handleOnItemPress} />
    </Sheet>
  )
})

const $panelHeader: ViewStyle = {
  padding: spacing.small,
  justifyContent: "space-between",
  alignItems: "center",
}
