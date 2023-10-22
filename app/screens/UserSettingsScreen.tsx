import { Button, Screen, Text } from "app/components"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import { AlertDialog, Button as NBButton } from "native-base"
import React, { useRef, useState } from "react"
import { ViewStyle } from "react-native"
import { EditProfileForm } from "./UserProfile"

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore } = useStores()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const onCloseAlert = () => setShowDeleteAlert(false)
  const cancelDeleteRef = useRef(null)

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <EditProfileForm />
      <Button preset="text" onPress={authStore.logout} tx="userSettingsScreen.logout" />
      <Button
        preset="text"
        onPress={() => setShowDeleteAlert(!showDeleteAlert)}
        tx="userSettingsScreen.deleteAccount"
      />

      <AlertDialog
        leastDestructiveRef={cancelDeleteRef}
        isOpen={showDeleteAlert}
        onClose={onCloseAlert}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>
            <Text tx="userSettingsScreen.deleteAccount" />
          </AlertDialog.Header>
          <AlertDialog.Body>
            <Text tx="userSettingsScreen.deleteAccountConfirmationMessage" />
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <NBButton.Group space={2}>
              <NBButton
                variant="unstyled"
                colorScheme="coolGray"
                onPress={onCloseAlert}
                ref={cancelDeleteRef}
              >
                <Text tx="common.cancel" />
              </NBButton>
              <NBButton colorScheme="danger" onPress={authStore.deleteAccount}>
                <Text tx="common.delete" />
              </NBButton>
            </NBButton.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
}
