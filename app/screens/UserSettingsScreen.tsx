import { Button, Icon, RowView, Screen, Text } from "app/components"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { colors, spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import { AlertDialog, Button as NBButton } from "native-base"
import React, { useRef, useState } from "react"
import { Image, ImageStyle, TouchableOpacity, View, ViewStyle } from "react-native"

const tempUserAvatar = require("../../assets/images/app-icon-all.png")

type SwitchSettingTileProps = {
  titleTx: TxKeyPath
  descriptionTx: TxKeyPath
  toggleState: boolean
  onToggle: (newState: boolean) => void
  isOnIcon: React.ReactNode
  isOffIcon: React.ReactNode
}

export const SwitchSettingTile: React.FC<SwitchSettingTileProps> = (
  props: SwitchSettingTileProps,
) => {
  const [isOn, setIsOn] = useState(props.toggleState)

  const _onToggle = () => {
    props.onToggle(!isOn)
    setIsOn(!isOn)
  }

  const $tileView: ViewStyle = {
    alignItems: "center",
    borderWidth: 1,
  }

  const $description: ViewStyle = {
    flex: 8,
  }

  const $iconButton: ViewStyle = {
    flex: 1,
  }

  return (
    <RowView style={$tileView}>
      <View style={$description}>
        <Text weight="bold" tx={props.titleTx} />
        <Text tx={props.descriptionTx} />
      </View>
      <TouchableOpacity onPress={_onToggle} style={$iconButton}>
        {isOn ? props.isOnIcon : props.isOffIcon}
      </TouchableOpacity>
    </RowView>
  )
}

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore, userStore } = useStores()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const onCloseAlert = () => setShowDeleteAlert(false)
  const cancelDeleteRef = useRef(null)

  const togglePrivateAccount = (privateAccount: boolean) => {
    const user = userStore.user
    user.privateAccount = privateAccount
    userStore.updateProfile(user)
  }

  return (
    <Screen style={$screenContentContainer}>
      <RowView justifyContent="center">
        <View style={$userHeaderContainer}>
          <Image source={tempUserAvatar} style={$userAvatar} />
          <Text preset="subheading">{userStore.displayName}</Text>
        </View>
      </RowView>

      <View>
        <Text tx="userSettingsScreen.preferencesSectionLabel" />
        <SwitchSettingTile
          titleTx="userSettingsScreen.privateAccountTitle"
          descriptionTx="userSettingsScreen.privateAccountDescription"
          toggleState={userStore.isPrivate}
          isOffIcon={<Icon name="lock-open-outline" size={30} />}
          isOnIcon={<Icon name="lock-closed" size={30} />}
          onToggle={togglePrivateAccount}
        />
      </View>

      <Button onPress={authStore.logout}>Logout</Button>
      <Button
        style={$deleteButton}
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
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}

const $userHeaderContainer: ViewStyle = {
  alignItems: "center",
}

const $userAvatar: ImageStyle = {
  height: 100,
  width: 100,
  borderRadius: 100,
}

const $deleteButton: ViewStyle = {
  backgroundColor: colors.danger,
}
