import { RowView, Sheet, Spacer, Text } from "app/components"
import { ExerciseCatalog } from "app/features/Exercises"
import { CreateExercise } from "app/features/Exercises/components/CreateExercise"
import { IExerciseModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ChevronLeft, FilePlus2, X } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React from "react"
import { View, ViewStyle } from "react-native"

type ExercisePickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemPress: (exercise: IExerciseModel) => void
}

export const ExercisePickerSheet = observer(function ExercisePickerSheet(
  props: ExercisePickerSheetProps,
) {
  const { open, onOpenChange, onItemPress } = props

  // hooks
  const { themeStore } = useStores()

  // states
  const [page, setPage] = React.useState<"catalog" | "create">("catalog")

  const handleOnItemPress = (exercise: IExerciseModel) => {
    onOpenChange(false)
    onItemPress(exercise)
  }

  const renderContent = () => {
    if (page === "create") {
      return (
        <>
          <RowView style={$panelHeader}>
            <RowView style={styles.alignCenter}>
              <ChevronLeft
                size={24}
                color={themeStore.colors("foreground")}
                onPress={() => setPage("catalog")}
              />
              <Text preset="subheading" tx="createExerciseScreen.createExerciseTitle" />
            </RowView>
          </RowView>
          <View style={styles.screenContainer}>
            <CreateExercise onCreateSuccess={() => setPage("catalog")} />
          </View>
        </>
      )
    }

    // catalog
    return (
      <>
        <RowView style={$panelHeader}>
          <Text preset="subheading" tx="exerciseManagerScreen.exerciseManagerTitle" />
          <RowView style={styles.alignCenter}>
            <FilePlus2
              size={24}
              color={themeStore.colors("foreground")}
              onPress={() => setPage("create")}
            />
            <Spacer type="horizontal" size="small" />
            <X
              size={24}
              color={themeStore.colors("foreground")}
              onPress={() => onOpenChange(false)}
            />
          </RowView>
        </RowView>

        <ExerciseCatalog onItemPress={handleOnItemPress} />
      </>
    )
  }

  console.debug("ExercisePickerSheet rendering")
  return (
    <Sheet
      disableDrag={true}
      forceRemoveScrollEnabled={open}
      open={open}
      onOpenChange={onOpenChange}
    >
      {renderContent()}
    </Sheet>
  )
})

const $panelHeader: ViewStyle = {
  paddingHorizontal: spacing.screenPadding,
  paddingVertical: spacing.extraSmall,
  minHeight: 60,
  justifyContent: "space-between",
  alignItems: "center",
}
