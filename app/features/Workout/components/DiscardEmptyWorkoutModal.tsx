import { Button, Modal, Spacer, Text } from "app/components"
import { useStores } from "app/stores"
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

    const { themeStore } = useStores()

    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
        <Text tx="activeWorkoutScreen.noExercisesAddedMessage" />
        <Spacer type="vertical" size="medium" />
        <Button preset="dangerText" tx="activeWorkoutScreen.discardWorkout" onPress={onDiscard} />
        <Button
          preset="text"
          textStyle={{ color: themeStore.colors("text") }}
          tx="common.cancel"
          onPress={onCancel}
        />
      </Modal>
    )
  },
)
