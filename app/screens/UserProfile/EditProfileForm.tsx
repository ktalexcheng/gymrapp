import { useFocusEffect } from "@react-navigation/native"
import {
  Avatar,
  Button,
  Icon,
  Modal,
  Picker,
  RestTimePicker,
  RowView,
  Spacer,
  Text,
  TextField,
} from "app/components"
import {
  AppColorScheme,
  AppColorSchemeLabelValuePairs,
  AppLocale,
  AppLocaleLabelValuePairs,
  UserErrorType,
  WeightUnit,
} from "app/data/constants"
import { Gym, User } from "app/data/types"
import { useLocale, useToast } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { logError } from "app/utils/logger"
import * as Device from "expo-device"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useRef, useState } from "react"
import {
  Alert,
  BackHandler,
  ImageStyle,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Popover } from "tamagui"
import { SwitchSettingTile } from "./UserSettingTile"

type EditProfileFormProps = {
  saveProfileCompletedCallback: () => void
  onBusyChange?: (isBusy: boolean) => void
}

export const EditProfileForm: FC<EditProfileFormProps> = observer((props: EditProfileFormProps) => {
  const { saveProfileCompletedCallback, onBusyChange } = props
  const mainNavigator = useMainNavigation()
  const { authenticationStore: authStore, userStore, themeStore } = useStores()
  const [toastShowTx] = useToast()

  // Form input values
  const firstNameInputRef = useRef<TextInput>(null)
  const lastNameInputRef = useRef<TextInput>(null)
  const [userHandle, setUserHandle] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [imagePath, setImagePath] = useState<string>()
  const [weightUnit, setWeightUnit] = useState(WeightUnit.kg)
  const [privateAccount, setPrivateAccount] = useState(false)
  const [appColorScheme, setAppColorScheme] = useState(AppColorScheme.Dark)
  const [appLocale, setAppLocale] = useState(AppLocale.en_US)
  const [autoRestTimerEnabled, setAutoRestTimerEnabled] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [showRestTimePicker, setShowRestTimePicker] = useState(false)
  const [myGyms, setMyGyms] = useState<Gym[]>([])
  const [_, setLocale] = useLocale()

  // Form state
  const [userHandleHelper, setUserHandleHelper] = useState<string>()
  const [userHandleError, setUserHandleError] = useState<string>()
  const [firstNameError, setFirstNameError] = useState<string>()
  const [lastNameError, setLastNameError] = useState<string>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  // const [isAutofilled, setIsAutofilled] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // The listener seems to only work with Android's native-stack, but not on iOS
  // So we need to disable gesture (for iOS swipe back) and disable header back button in MainNavigator
  // to force the user to use the save or discard buttons
  // UPDATE: This is too much hassle, disabling the back button for android too
  useFocusEffect(() => {
    // React Navigation will keep the screen mounted when we navigate to the next screen (e.g. when we go to the add to my gyms screen)
    // so we need to use useFocusEffect to add the listener only when the screen is focused
    if (Device.osName === "ios") return undefined

    const backPressListener = BackHandler.addEventListener("hardwareBackPress", () => {
      toastShowTx("editProfileForm.backButtonDisabledMessage")
      return true
    })

    return () => backPressListener.remove()
  })

  useEffect(() => {
    const checkForUnsavedChanges = () => {
      console.debug("EditProfileForm.checkForUnsavedChanges: checking for changes")
      if (userHandle?.toLowerCase() !== userStore.getPropAsJS("user._userHandleLower")) return true
      if (firstName !== userStore.getPropAsJS("user.firstName")) return true
      if (lastName !== userStore.getPropAsJS("user.lastName")) return true
      if (imagePath !== userStore.getPropAsJS("user.avatarUrl")) return true
      if (weightUnit !== userStore.getUserPreference<WeightUnit>("weightUnit")) return true
      if (privateAccount !== userStore.getPropAsJS("user.privateAccount")) return true
      if (appLocale !== userStore.getUserPreference<AppLocale>("appLocale")) return true
      if (appColorScheme !== userStore.getUserPreference<AppColorScheme>("appColorScheme"))
        return true
      if (autoRestTimerEnabled !== userStore.getUserPreference<boolean>("autoRestTimerEnabled"))
        return true
      if (restTime !== userStore.getUserPreference<number>("restTime")) return true

      console.debug("EditProfileForm.checkForUnsavedChanges: no changes detected")
      return false
    }

    setHasUnsavedChanges(checkForUnsavedChanges())
  }, [
    userHandle,
    firstName,
    lastName,
    imagePath,
    weightUnit,
    privateAccount,
    appLocale,
    appColorScheme,
    autoRestTimerEnabled,
    restTime,
  ])

  useEffect(() => {
    // Populate form with user profile data
    if (userStore.isLoadingProfile) return

    // if (!userStore.isLoadingProfile && !isAutofilled) {
    console.debug("EditProfileForm autofilling form with current user profile data")
    setUserHandle(userStore.getPropAsJS("user.userHandle"))
    setFirstName(userStore.getPropAsJS("user.firstName"))
    setLastName(userStore.getPropAsJS("user.lastName"))
    setImagePath(userStore.getPropAsJS("user.avatarUrl"))
    setWeightUnit(userStore.getUserPreference<WeightUnit>("weightUnit"))
    setAppLocale(userStore.getUserPreference<AppLocale>("appLocale"))
    setAppColorScheme(userStore.getUserPreference<AppColorScheme>("appColorScheme"))
    setPrivateAccount(userStore.getPropAsJS("user.privateAccount") ?? false)
    setAutoRestTimerEnabled(userStore.getUserPreference<boolean>("autoRestTimerEnabled"))
    setRestTime(userStore.getUserPreference<number>("restTime"))
    // My gyms are managed in a separate flow to the user profile, so always update it
    setMyGyms(userStore.getPropAsJS("user.myGyms"))
  }, [userStore.user])

  useEffect(() => {
    setUserHandleError(undefined)
    setUserHandleHelper(undefined)
    if (!userHandle || userHandle === userStore.getPropAsJS("user.userHandle")) return undefined

    // Check if userHandle is valid
    if (!/^[a-zA-Z0-9_.]{1,30}$/.test(userHandle)) {
      setUserHandleError(translate("editProfileForm.error.userHandleInvalidMessage"))
      return undefined
    }

    // Check if userHandle is already taken
    const checkUserHandleTimeout = setTimeout(async () => {
      if (userHandle.length === 0) return

      const isAvailable = await userStore.userHandleIsAvailable(userHandle)
      if (!isAvailable) {
        setUserHandleError(translate("editProfileForm.error.userHandleIsTakenMessage"))
      } else {
        setUserHandleHelper(translate("editProfileForm.newUserHandleAvailableMessage"))
      }
    }, 500)

    return () => clearTimeout(checkUserHandleTimeout)
  }, [userHandle])

  useEffect(() => {
    if (isSaved) {
      saveProfileCompletedCallback()
    }
  }, [isSaved])

  // EditProfileForm is the same component for both CreateProfileScreen and UserSettingsScreen
  // so we need to check if the user is creating a new profile or editing an existing one
  // user will not be allowed to go back if they are creating a new profile
  const confirmDiscardChanges = () => {
    console.debug("EditProfileForm.confirmDiscardChanges:", { hasUnsavedChanges })
    if (!hasUnsavedChanges) {
      if (mainNavigator.canGoBack()) mainNavigator.goBack()
      return
    }

    Alert.alert(
      translate("editProfileForm.discardAlertTitle"),
      translate("editProfileForm.discardAlertMessage"),
      [
        { text: translate("editProfileForm.alertDialogResume"), style: "cancel" },
        {
          text: translate("common.discard"),
          style: "destructive",
          onPress: () => {
            if (mainNavigator.canGoBack()) mainNavigator.goBack()
          },
        },
      ],
    )
  }

  const isInvalidForm = () => {
    let errorFound = false

    if (!userHandle || userHandleError) {
      setUserHandleError(
        (prev) => prev || translate("editProfileForm.error.userHandleMissingMessage"),
      )
      errorFound = true
    }

    if (!firstName || firstName.length === 0) {
      setFirstNameError(translate("editProfileForm.error.firstNameMissingMessage"))
      errorFound = true
    }

    if (!lastName || lastName.length === 0) {
      setLastNameError(translate("editProfileForm.error.lastNameMissingMessage"))
      errorFound = true
    }

    return errorFound
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        console.debug("EditProfileForm.pickImage: image picked successfully", {
          uri: result.assets[0].uri,
        })
        setImagePath(result.assets[0].uri)
      }
    } catch (e) {
      logError(e, "EditProfileForm.pickImage error")
    }
  }

  const saveProfile = async () => {
    if (isInvalidForm() || !authStore.userId) return

    onBusyChange && onBusyChange(true)

    try {
      const user = {
        _userHandleLower: userHandle.toLowerCase(),
        userHandle,
        firstName,
        lastName,
        privateAccount,
        preferences: {
          appLocale,
          weightUnit,
          autoRestTimerEnabled,
          restTime,
          appColorScheme,
        },
      } as User

      // Upload new avatar image if it has changed
      if (imagePath && imagePath !== userStore.getPropAsJS("user.avatarUrl")) {
        const avatarUrl = await userStore.uploadUserAvatar(imagePath)
        user.avatarUrl = avatarUrl
      }

      // Update app locale if it has changed
      if (appLocale !== userStore.getUserPreference<AppLocale>("appLocale")) {
        setLocale(appLocale)
      }

      if (userStore.user) {
        await userStore
          .updateProfile(user)
          .then(() => {
            setHasUnsavedChanges(false)
            setIsSaved(true)
          })
          .catch((e: Error) => {
            if (e.cause === UserErrorType.UserHandleAlreadyTakenError) {
              setUserHandleError(translate("editProfileForm.error.userHandleIsTakenMessage"))
            } else {
              logError(e, "EditProfileForm.saveProfile error")
              toastShowTx("common.error.unknownErrorMessage")
            }
          })
      } else {
        // New user profile is created after the user has verified their email,
        // or after the user signs in with a social provider (Google, Apple)
        user.userId = authStore.userId
        user.email = authStore.email
        user.providerId = authStore.providerId

        await userStore.createNewProfile(user).then(() => {
          setHasUnsavedChanges(false)
          setIsSaved(true)
        })
      }
      console.debug("EditProfileForm.saveProfile: profile saved successfully")
    } catch (e) {
      logError(e, "EditProfileForm.saveProfile error")
    } finally {
      onBusyChange && onBusyChange(false)
    }
  }

  const removeAvatar = () => {
    setImagePath(undefined)
  }

  const renderMyGymsItem = () => {
    const $itemContainer: ViewStyle = {
      alignItems: "center",
      justifyContent: "space-between",
    }

    if (!myGyms?.length) {
      return <Text tx="editProfileForm.myGymsDescription" preset="formHelper" />
    }

    return (
      <>
        {myGyms.map((myGym) => {
          return (
            <RowView key={myGym.gymId} style={$itemContainer}>
              <View style={styles.flex3}>
                <TouchableOpacity
                  onPress={() => mainNavigator.navigate("GymDetails", { gymId: myGym.gymId })}
                >
                  <Text text={myGym.gymName} weight="normal" numberOfLines={1} />
                </TouchableOpacity>
              </View>
              <View style={styles.flex1}>
                <Button
                  tx="common.delete"
                  preset="text"
                  onPress={() => userStore.removeFromMyGyms(myGym)}
                />
              </View>
            </RowView>
          )
        })}
      </>
    )
  }

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRestTimePicker}
        onRequestClose={() => setShowRestTimePicker(false)}
      >
        <Text tx="editProfileForm.defaultRestTimeSelectorLabel" preset="formLabel" />
        <RestTimePicker initialRestTime={restTime} onRestTimeChange={setRestTime} />
        <Button tx="common.ok" preset="text" onPress={() => setShowRestTimePicker(false)} />
      </Modal>
      <View style={$contentContainer}>
        <RowView style={$headerContainer}>
          <Button
            preset="text"
            disabled={!mainNavigator.canGoBack()}
            tx={hasUnsavedChanges ? "common.discard" : "common.back"}
            onPress={confirmDiscardChanges}
          />
          <Button
            preset="text"
            tx="common.save"
            onPress={saveProfile}
            disabled={!hasUnsavedChanges}
          />
        </RowView>

        <Text tx="editProfileForm.editProfileTitle" preset="screenTitle" />

        <Spacer type="vertical" size="large" />
        <Text tx="editProfileForm.aboutYouSectionLabel" preset="subheading" />

        <TextField
          status={userHandleError ? "error" : null}
          value={userHandle}
          onChangeText={setUserHandle}
          containerStyle={styles.formFieldTopMargin}
          autoCapitalize="none"
          autoCorrect={false}
          labelTx="editProfileForm.userHandleLabel"
          onSubmitEditing={() => firstNameInputRef.current?.focus()}
          helper={userHandleError ?? userHandleHelper}
        />

        <View style={styles.formFieldTopMargin}>
          <Text tx="editProfileForm.uploadAvatarLabel" preset="formLabel" />
          <View style={$avatar}>
            <Icon
              name="close-circle"
              style={$removeAvatarButton}
              onPress={removeAvatar}
              color={themeStore.colors("tint")}
              size={30}
            />
            <TouchableOpacity onPress={pickImage}>
              <Avatar imageUrl={imagePath} user={userStore.user} size="xxl" />
            </TouchableOpacity>
          </View>
        </View>

        <TextField
          ref={firstNameInputRef}
          status={firstNameError ? "error" : null}
          value={firstName}
          onChangeText={setFirstName}
          containerStyle={styles.formFieldTopMargin}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.firstName"
          onSubmitEditing={() => lastNameInputRef.current?.focus()}
          helper={firstNameError}
        />

        <TextField
          ref={lastNameInputRef}
          status={lastNameError ? "error" : null}
          value={lastName}
          onChangeText={setLastName}
          containerStyle={styles.formFieldTopMargin}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.lastName"
          helper={lastNameError}
        />

        <View style={styles.formFieldTopMargin}>
          <RowView style={styles.justifyBetween}>
            <Text tx="editProfileForm.myGymsLabel" preset="formLabel" />
            {userStore.profileIncomplete && (
              <Popover placement="bottom-end">
                <Popover.Trigger>
                  <Icon name="information-circle-outline" size={24} />
                </Popover.Trigger>

                <Popover.Content unstyled style={themeStore.styles("walkthroughPopoverContainer")}>
                  <Text
                    tx="editProfileForm.availableAfterProfileCreatedMessage"
                    preset="formHelper"
                  />
                </Popover.Content>
              </Popover>
            )}
          </RowView>
          <View
            style={userStore.profileIncomplete ? styles.disabled : undefined}
            pointerEvents={userStore.profileIncomplete ? "none" : "auto"}
          >
            {renderMyGymsItem()}
            <Button
              preset="text"
              tx="editProfileForm.addGymButtonLabel"
              onPress={() => mainNavigator.navigate("AddToMyGyms")}
            />
          </View>
        </View>

        <Spacer type="vertical" size="large" />
        <Text tx="editProfileForm.preferencesSectionLabel" preset="subheading" />

        <SwitchSettingTile
          titleTx="editProfileForm.privateAccountTitle"
          descriptionTx="editProfileForm.privateAccountDescription"
          containerStyle={styles.formFieldTopMargin}
          toggleState={privateAccount}
          isOffIcon={<Icon name="lock-open-outline" size={30} />}
          isOnIcon={<Icon name="lock-closed" size={30} />}
          onToggle={() => setPrivateAccount(!privateAccount)}
        />

        <Picker
          containerStyle={styles.formFieldTopMargin}
          onValueChange={(value: WeightUnit) => setWeightUnit(value)}
          labelTx="editProfileForm.weightUnitLabel"
          itemsList={[
            { label: WeightUnit.kg, value: WeightUnit.kg },
            { label: WeightUnit.lbs, value: WeightUnit.lbs },
          ]}
          selectedValue={weightUnit}
        />

        <SwitchSettingTile
          titleTx="editProfileForm.autoRestTimerLabel"
          descriptionTx="editProfileForm.autoRestTimerDescription"
          containerStyle={styles.formFieldTopMargin}
          toggleState={autoRestTimerEnabled}
          // isOffIcon={<Icon name="radio-button-off" size={30} />}
          // isOnIcon={<Icon name="radio-button-on" size={30} />}
          onToggle={() => setAutoRestTimerEnabled((prev) => !prev)}
        />

        <View style={[styles.formFieldTopMargin, !autoRestTimerEnabled && styles.disabled]}>
          <Text tx="editProfileForm.defaultRestTimeLabel" preset="formLabel" />
          <Spacer type="vertical" size="small" />
          <TouchableOpacity
            style={themeStore.styles("listItemContainer")}
            onPress={() => setShowRestTimePicker(true)}
            disabled={!autoRestTimerEnabled}
          >
            <Text>{formatSecondsAsTime(restTime)}</Text>
          </TouchableOpacity>
        </View>

        <Picker
          containerStyle={styles.formFieldTopMargin}
          onValueChange={(value: AppLocale) => setAppLocale(value)}
          labelTx="editProfileForm.appLocaleLabel"
          itemsList={AppLocaleLabelValuePairs()}
          selectedValue={appLocale}
        />

        <Picker
          containerStyle={styles.formFieldTopMargin}
          onValueChange={(value: AppColorScheme) => setAppColorScheme(value)}
          labelTx="editProfileForm.appAppearanceLabel"
          itemsList={AppColorSchemeLabelValuePairs()}
          selectedValue={appColorScheme}
        />

        <Spacer type="vertical" size="large" />

        <Button
          tx="editProfileForm.saveProfileChanges"
          disabled={!hasUnsavedChanges}
          onPress={saveProfile}
        />
        <Button
          preset="text"
          disabled={!mainNavigator.canGoBack()}
          tx={hasUnsavedChanges ? "common.discard" : "common.back"}
          onPress={confirmDiscardChanges}
        />
      </View>
    </>
  )
})

const $contentContainer: ViewStyle = {
  // height: "100%",
  // width: "100%",
}

const $headerContainer: ViewStyle = {
  justifyContent: "space-between",
}

const $avatar: ImageStyle = {
  alignSelf: "center",
}

const $removeAvatarButton: ImageStyle = {
  position: "absolute",
  zIndex: 1,
}
