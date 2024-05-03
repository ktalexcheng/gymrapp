import { Button, Icon } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { WorkoutId } from "app/data/types"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert, View } from "react-native"
import { Popover } from "tamagui"
import { LoadingScreen } from "../LoadingScreen"

interface WorkoutSummaryMenuProps {
  workoutSource: WorkoutSource
  workoutId: WorkoutId
  onBusyChange?: (isBusy: boolean) => void
}

export const WorkoutSummaryMenu = observer((props: WorkoutSummaryMenuProps) => {
  const { workoutSource, workoutId, onBusyChange } = props
  const { feedStore, themeStore, workoutEditorStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [menuOpen, setMenuOpen] = useState(false)

  const workout = feedStore.getWorkout(workoutSource, workoutId)

  const showDeleteConfimrationAlert = () => {
    setMenuOpen(false)

    Alert.alert(
      translate("workoutSummaryMenu.deleteWorkoutAlertTitle"),
      translate("workoutSummaryMenu.deleteWorkoutAlertMessage"),
      [
        {
          text: translate("common.cancel"),
          style: "cancel",
        },
        {
          text: translate("common.delete"),
          onPress: () => {
            if (onBusyChange) onBusyChange(true)
            feedStore.deleteWorkout(workoutId).then(() => {
              if (onBusyChange) onBusyChange(false)
              mainNavigation.goBack()
            })
          },
          style: "destructive",
        },
      ],
    )
  }

  const goToEditWorkout = () => {
    setMenuOpen(false)
    workoutEditorStore.hydrateWithWorkout(workout)
    mainNavigation.navigate("EditWorkout")
  }

  const renderPopoverContent = () => {
    return (
      <>
        <Button
          preset="menuItem"
          tx="workoutSummaryMenu.editWorkoutButtonLabel"
          onPress={goToEditWorkout}
        />
        <Button
          preset="menuItem"
          tx="common.delete"
          textStyle={{ color: themeStore.colors("danger") }}
          onPress={showDeleteConfimrationAlert}
        />
      </>
    )
  }

  if (!workout) return <LoadingScreen />

  return (
    <Popover placement="bottom-end" open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
      <Popover.Trigger>
        <Icon name="ellipsis-vertical" size={24} />
      </Popover.Trigger>

      <Popover.Content unstyled style={themeStore.styles("menuPopoverContainer")}>
        <View style={styles.fullWidth}>{renderPopoverContent()}</View>
      </Popover.Content>
    </Popover>
  )
})
