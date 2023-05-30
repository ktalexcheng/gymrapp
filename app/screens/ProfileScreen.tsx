import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Screen, Text } from "app/components"
import { TabScreenProps } from "app/navigators"
import { observer } from "mobx-react-lite"
import React, { FC, useRef, useState } from "react"
import { ViewStyle } from "react-native"
// import { useNavigation } from "@react-navigation/native"
import { useStores } from "app/stores"
import { AlertDialog, Button as NBButton } from "native-base"
import { spacing } from "../theme"

interface ProfileScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()
  const { authenticationStore: authStore } = useStores()

  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const onCloseAlert = () => setShowDeleteAlert(false)

  const cancelDeleteRef = useRef(null)

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      <Text>Signed in as: {authStore.user.email}</Text>
      <Button onPress={authStore.logout}>Logout</Button>
      <NBButton onPress={() => setShowDeleteAlert(!showDeleteAlert)}>Delete account</NBButton>
      <AlertDialog
        leastDestructiveRef={cancelDeleteRef}
        isOpen={showDeleteAlert}
        onClose={onCloseAlert}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Delete Customer</AlertDialog.Header>
          <AlertDialog.Body>
            This will remove all user data. This action cannot be reversed. Are you sure?
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <NBButton.Group space={2}>
              <NBButton
                variant="unstyled"
                colorScheme="coolGray"
                onPress={onCloseAlert}
                ref={cancelDeleteRef}
              >
                Cancel
              </NBButton>
              <NBButton colorScheme="danger" onPress={authStore.deleteAccount}>
                Delete
              </NBButton>
            </NBButton.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}
