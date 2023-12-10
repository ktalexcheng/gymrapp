import {
  Avatar,
  Button,
  Dropdown,
  Icon,
  RowView,
  Spacer,
  Text,
  TextField,
  WheelPickerFlat,
} from "app/components"
import { AppLocale, WeightUnit } from "app/data/constants"
import { Gym, User } from "app/data/model"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { colors, spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import * as Device from "expo-device"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useRef, useState } from "react"
import {
  Alert,
  ImageStyle,
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { LoadingScreen } from "../LoadingScreen"
import { SwitchSettingTile } from "./UserSettingTile"

type RestTimePickerProps = {
  restTime: number
  setRestTime: (restTime: number) => void
}

const RestTimePicker = (props: RestTimePickerProps) => {
  const { restTime, setRestTime } = props

  const restTimeList = Array(60)
    .fill(null)
    .map<any>((_, i) => {
      const seconds = (i + 1) * 5
      return {
        label: formatSecondsAsTime(seconds),
        value: seconds,
      }
    })

  function updateRestTime(index: number) {
    setRestTime(restTimeList[index].value)
  }

  return (
    <View>
      <WheelPickerFlat
        enabled={true}
        items={restTimeList}
        onIndexChange={updateRestTime}
        itemHeight={30}
        initialScrollIndex={restTime / 5 - 1}
      />
    </View>
  )
}

type EditProfileFormProps = {
  saveProfileCompletedCallback: () => void
}

export const EditProfileForm: FC<EditProfileFormProps> = observer((props: EditProfileFormProps) => {
  const { saveProfileCompletedCallback } = props
  const mainNavigator = useMainNavigation()
  const { authenticationStore: authStore, userStore } = useStores()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [imagePath, setImagePath] = useState("")
  const [weightUnit, setWeightUnit] = useState(WeightUnit.kg) // TODO: Default to lbs if system locale is en-US
  const [privateAccount, setPrivateAccount] = useState(false)
  const [appLocale, setAppLocale] = useState(AppLocale.en_US) // TODO: Default to match system locale
  const [autoRestTimerEnabled, setAutoRestTimerEnabled] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [showRestTimePicker, setShowRestTimePicker] = useState(false)
  const [firstNameError, setFirstNameError] = useState(false)
  const [lastNameError, setLastNameError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const lastNameInputRef = useRef<TextInput>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [myGyms, setMyGyms] = useState<Gym[]>([])
  const [isAutofilled, setIsAutofilled] = useState(false)
  const [isDiscardConfirmed, setIsDiscardConfirmed] = useState(false)

  // The listener seems to work with Android's native-stack, but not on iOS
  // So we need to disable gesture (for iOS swipe back) and disable header back button
  // to force the user to use the save or discard buttons
  useEffect(() => {
    if (Device.osName !== "Android" || isDiscardConfirmed) return undefined

    console.debug("EditProfileForm updating beforeRemove listener")
    const unsubscribeListener = mainNavigator.addListener("beforeRemove", async (e) => {
      while (userStore.isLoadingProfile) {
        // Wait until profile is loaded before checking for unsaved changes
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      console.debug("EditProfileForm.beforeRemove listener hasUnsavedChanges:", hasUnsavedChanges)
      if (!hasUnsavedChanges) return

      // Prevent default behavior of leaving the screen and show alert
      e.preventDefault()
      confirmDiscardChanges(() => mainNavigator.dispatch(e.data.action))
    })

    return unsubscribeListener
  }, [mainNavigator, hasUnsavedChanges, isDiscardConfirmed])

  useEffect(() => {
    const checkForUnsavedChanges = () => {
      console.debug("EditProfileForm.checkForUnsavedChanges: checking for changes")
      if (firstName !== userStore.getProp("user.firstName")) return true
      if (lastName !== userStore.getProp("user.lastName")) return true
      if (imagePath !== userStore.getProp("user.avatarUrl")) return true
      if (weightUnit !== userStore.getUserPreference<WeightUnit>("weightUnit")) return true
      if (privateAccount !== userStore.getProp("user.privateAccount")) return true
      if (appLocale !== userStore.getUserPreference<AppLocale>("appLocale")) return true
      if (autoRestTimerEnabled !== userStore.getUserPreference<boolean>("autoRestTimerEnabled"))
        return true
      if (restTime !== userStore.getUserPreference<number>("restTime")) return true

      console.debug("EditProfileForm.checkForUnsavedChanges: no changes detected")
      return false
    }

    setHasUnsavedChanges(checkForUnsavedChanges())

    // if (isAutofilled) {
    //   console.debug("EditProfileForm changes detected")
    //   setHasUnsavedChanges(true)
    // }
  }, [
    firstName,
    lastName,
    imagePath,
    weightUnit,
    privateAccount,
    appLocale,
    autoRestTimerEnabled,
    restTime,
  ])

  useEffect(() => {
    // Populate form with user profile data
    if (!userStore.isLoadingProfile && !isAutofilled) {
      console.debug("EditProfileForm autofilling form with current user profile data")
      setFirstName(userStore.getProp("user.firstName"))
      setLastName(userStore.getProp("user.lastName"))
      setImagePath(userStore.getProp("user.avatarUrl"))
      setWeightUnit(userStore.getUserPreference<WeightUnit>("weightUnit"))
      setAppLocale(userStore.getUserPreference<AppLocale>("appLocale"))
      setPrivateAccount(userStore.getProp("user.privateAccount") ?? false)
      setAutoRestTimerEnabled(userStore.getUserPreference<boolean>("autoRestTimerEnabled"))
      setRestTime(userStore.getUserPreference<number>("restTime"))
      setMyGyms(userStore.getProp("user.myGyms"))
      setIsAutofilled(true)
    }
  }, [userStore.user])

  const confirmDiscardChanges = (discardCallback: () => void) => {
    if (!hasUnsavedChanges) {
      discardCallback()
      return
    }

    Alert.alert(
      translate("editProfileForm.alertDialogTitle"),
      translate("editProfileForm.alertDialogDiscardChangesMessage"),
      [
        { text: translate("editProfileForm.alertDialogResume"), style: "cancel" },
        {
          text: translate("common.discard"),
          style: "destructive",
          onPress: () => {
            discardCallback()
            setIsDiscardConfirmed(true)
          },
        },
      ],
    )
  }

  const isInvalidForm = () => {
    let errorFound = false

    if (firstName.length === 0) {
      setFirstNameError(true)
      errorFound = true
    }
    if (lastName.length === 0) {
      setLastNameError(true)
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
        setImagePath(result.assets[0].uri)
      }
    } catch (e) {
      console.error("editProfileForm.pickImage error:", e)
    }
  }

  const saveProfile = async () => {
    if (isInvalidForm()) return

    setIsProcessing(true)

    try {
      const user = {
        firstName,
        lastName,
        privateAccount,
        preferences: {
          appLocale,
          weightUnit,
          autoRestTimerEnabled,
          restTime,
        },
      } as User

      if (imagePath) {
        const avatarUrl = await userStore.uploadUserAvatar(imagePath)
        user.avatarUrl = avatarUrl
      }

      if (userStore.userProfileExists) {
        await userStore.updateProfile(user)
      } else {
        // User profile should already be created upon sign up,
        // this condition should only be possible if connection was lost
        // or during development
        user.userId = authStore.userId
        user.email = authStore.email
        user.providerId = authStore.providerId

        await userStore.createNewProfile(user)
      }

      console.debug("editProfileForm.saveProfile: profile saved successfully")
      setHasUnsavedChanges(false)
      console.debug("editProfileForm.saveProfile hasUnsavedChanges:", hasUnsavedChanges)
    } catch (e) {
      console.error("editProfileForm.createProfile error:", e)
    } finally {
      setIsProcessing(false)
    }

    saveProfileCompletedCallback()
  }

  const removeAvatar = () => {
    setImagePath(null)
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
              <Text text={myGym.gymName} weight="normal" />
              <Button
                tx="common.delete"
                preset="text"
                onPress={() => userStore.removeFromMyGyms(myGym)}
              />
            </RowView>
          )
        })}
      </>
    )
  }

  if (isProcessing) {
    return <LoadingScreen />
  }

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRestTimePicker}
        onRequestClose={() => setShowRestTimePicker(false)}
      >
        <View style={$restTimePickerContainer}>
          <View style={$restTimePicker}>
            <Text tx="editProfileForm.defaultRestTimeSelectorLabel" preset="formLabel" />
            <RestTimePicker restTime={restTime} setRestTime={setRestTime} />
            <Button tx="common.ok" preset="text" onPress={() => setShowRestTimePicker(false)} />
          </View>
        </View>
      </Modal>
      <View style={$contentContainer}>
        <RowView style={$headerContainer}>
          <Button
            preset="text"
            tx={hasUnsavedChanges ? "common.discard" : "common.back"}
            onPress={() => {
              confirmDiscardChanges(() => mainNavigator.goBack())
            }}
          />
          <Button
            preset="text"
            tx="common.save"
            onPress={saveProfile}
            disabled={!hasUnsavedChanges}
          />
        </RowView>
        <Text tx="editProfileForm.editProfileTitle" preset="heading" />
        <View style={styles.formFieldTopMargin}>
          <Text tx="editProfileForm.uploadAvatarLabel" preset="formLabel" />
          <View style={$avatar}>
            <Icon
              name="close-circle"
              color={colors.actionable}
              containerStyle={$removeAvatarButton}
              onPress={removeAvatar}
              size={30}
            />
            <TouchableOpacity onPress={pickImage}>
              {imagePath ? (
                <Avatar source={imagePath} size="xxl" />
              ) : (
                <Avatar user={userStore.user} size="xxl" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TextField
          status={firstNameError ? "error" : null}
          value={firstName}
          onChangeText={setFirstName}
          containerStyle={styles.formFieldTopMargin}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.firstName"
          onSubmitEditing={() => lastNameInputRef.current?.focus()}
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
        />

        <View style={styles.formFieldTopMargin}>
          <Text tx="editProfileForm.myGymsLabel" preset="formLabel" />
          {renderMyGymsItem()}
          <Button
            preset="text"
            tx="editProfileForm.addGymButtonLabel"
            onPress={() => mainNavigator.navigate("GymSearch")}
          />
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

        <Dropdown
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
            style={styles.listItemContainer}
            onPress={() => setShowRestTimePicker(true)}
            disabled={!autoRestTimerEnabled}
          >
            <Text>{formatSecondsAsTime(restTime)}</Text>
          </TouchableOpacity>
        </View>

        <Dropdown
          containerStyle={styles.formFieldTopMargin}
          onValueChange={(value: AppLocale) => setAppLocale(value)}
          labelTx="editProfileForm.appLocaleLabel"
          itemsList={[
            { label: AppLocale.en_US, value: AppLocale.en_US },
            { label: AppLocale.zh_TW, value: AppLocale.zh_TW },
          ]}
          selectedValue={appLocale}
        />

        <Spacer type="vertical" size="large" />
        {/* Important to await saveProfile() so we ensure saveProfileCompletedCallback is called last */}
        <Button tx="editProfileForm.saveProfileChanges" onPress={saveProfile} />
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

const $restTimePickerContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.large,
}

const $restTimePicker: ViewStyle = {
  backgroundColor: colors.contentBackground,
  borderRadius: 20,
  padding: 35,
  width: "100%",
}
