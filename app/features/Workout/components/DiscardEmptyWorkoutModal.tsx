import { Button, Modal, Spacer, Text } from "app/components"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"

type DiscardEmptyWorkoutModalProps = {
  visible: boolean
  onDiscard: () => void
  onCancel: () => void
}

export const DiscardEmptyWorkoutModal: FC<DiscardEmptyWorkoutModalProps> = observer(
  function EmptyWorkoutModal(props: DiscardEmptyWorkoutModalProps) {
    const { visible, onDiscard, onCancel } = props

    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
        <Text tx="activeWorkoutScreen.noExercisesAddedMessage" />
        <Spacer type="vertical" size="medium" />
        <Button preset="text" tx="common.cancel" onPress={onCancel} />
        <Button preset="dangerText" tx="activeWorkoutScreen.discardWorkout" onPress={onDiscard} />
      </Modal>
    )
  },
)
