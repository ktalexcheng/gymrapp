import { Button, Modal, Spacer, Text } from "app/components"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"

type RemoveIncompleteSetsModalProps = {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const RemoveIncompleteSetsModal: FC<RemoveIncompleteSetsModalProps> = observer(
  function RemoveIncompleteSetsModal(props: RemoveIncompleteSetsModalProps) {
    const { visible, onConfirm, onCancel } = props

    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
        <Text tx="activeWorkoutScreen.dialogRemoveIncompletedSets" />
        <Spacer type="vertical" size="medium" />
        <Button
          preset="text"
          tx="activeWorkoutScreen.confirmRemoveIncompletedSets"
          onPress={onConfirm}
        />
        <Button
          preset="text"
          tx="activeWorkoutScreen.rejectRemoveIncompletedSets"
          onPress={onCancel}
        />
      </Modal>
    )
  },
)
