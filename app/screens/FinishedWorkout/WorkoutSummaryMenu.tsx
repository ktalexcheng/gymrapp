import { Button, Icon, Modal, RowView, TextField } from "app/components"
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
  onWorkoutUpdated?: () => void
}

export const WorkoutSummaryMenu = observer((props: WorkoutSummaryMenuProps) => {
  const { workoutSource, workoutId, onBusyChange, onWorkoutUpdated } = props
  const { feedStore, themeStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [workoutTitle, setWorkoutTitle] = useState<string>()
  const [workoutTitleError, setWorkoutTitleError] = useState(false)
  const [showEditTitleModal, setShowEditTitleModal] = useState(false)

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

  const handleShowEditTitleModal = () => {
    if (!workout) return

    setWorkoutTitle(workout.workoutTitle)
    setMenuOpen(false)
    setShowEditTitleModal(true)
  }

  const updateWorkoutTitle = () => {
    if (workoutTitle) {
      if (onBusyChange) onBusyChange(true)
      feedStore.updateWorkout(workoutId, { workoutTitle }).then(() => {
        if (onBusyChange) onBusyChange(false)
        if (onWorkoutUpdated) onWorkoutUpdated()
      })
      setWorkoutTitleError(false)
      setShowEditTitleModal(false)
    } else {
      setWorkoutTitleError(true)
    }
  }

  const renderPopoverContent = () => {
    return (
      <>
        <Button
          preset="menuItem"
          tx="workoutSummaryMenu.editTitleLabel"
          onPress={handleShowEditTitleModal}
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
    <>
      <Modal
        visible={showEditTitleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditTitleModal(false)}
      >
        <TextField
          labelTx="workoutSummaryMenu.workoutTitleLabel"
          status={workoutTitleError ? "error" : null}
          value={workoutTitle}
          onChangeText={setWorkoutTitle}
          onSubmitEditing={updateWorkoutTitle}
        />
        <RowView style={styles.justifyAround}>
          <Button preset="text" tx="common.cancel" onPress={() => setShowEditTitleModal(false)} />
          <Button preset="text" tx="common.save" onPress={updateWorkoutTitle} />
        </RowView>
      </Modal>

      <Popover placement="bottom-end" open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
        <Popover.Trigger>
          <Icon name="ellipsis-vertical" size={24} />
        </Popover.Trigger>

        <Popover.Content unstyled style={themeStore.styles("menuPopoverContainer")}>
          <View style={styles.fullWidth}>{renderPopoverContent()}</View>
        </Popover.Content>
      </Popover>
    </>
  )
})
