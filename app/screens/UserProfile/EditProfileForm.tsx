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
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"
import React, { useEffect, useRef, useState } from "react"
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

export const EditProfileForm = observer(() => {
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
  const hasUnsavedChangesRef = useRef(false)
  const [myGyms, setMyGyms] = useState<Gym[]>([])

  useEffect(() => {
    const unsubscribeListener = mainNavigator.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChangesRef.current) return

      // Prevent default behavior of leaving the screen
      e.preventDefault()

      Alert.alert(
        translate("editProfileForm.alertDialogTitle"),
        translate("editProfileForm.alertDialogDiscardChangesMessage"),
        [
          { text: translate("editProfileForm.alertDialogResume"), style: "cancel" },
          {
            text: translate("editProfileForm.alertDialogDiscard"),
            style: "destructive",
            // If discarding, then we dispatch the action we blocked earlier
            onPress: () => mainNavigator.dispatch(e.data.action),
          },
        ],
      )
    })

    return unsubscribeListener
  }, [])

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

    hasUnsavedChangesRef.current = checkForUnsavedChanges()
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
    if (!userStore.isLoadingProfile) {
      setFirstName(userStore.getProp("user.firstName"))
      setLastName(userStore.getProp("user.lastName"))
      setImagePath(userStore.getProp("user.avatarUrl"))
      setWeightUnit(userStore.getUserPreference<WeightUnit>("weightUnit"))
      setAppLocale(userStore.getUserPreference<AppLocale>("appLocale"))
      setPrivateAccount(userStore.getProp("user.privateAccount"))
      setAutoRestTimerEnabled(userStore.getUserPreference<boolean>("autoRestTimerEnabled"))
      setRestTime(userStore.getUserPreference<number>("restTime"))
      setMyGyms(userStore.getProp("user.myGyms"))
    }
  }, [userStore.user])

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

      hasUnsavedChangesRef.current = false
      mainNavigator.goBack()
    } catch (e) {
      console.error("editProfileForm.createProfile error:", e)
    }

    setIsProcessing(false)
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
  console.debug("imagePath", imagePath)
  return (
    <View style={$contentContainer}>
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
        size="md"
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
        size="md"
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
      <Button tx="editProfileForm.saveProfileChanges" onPress={saveProfile} />
    </View>
  )
})

const $contentContainer: ViewStyle = {
  // height: "100%",
  // width: "100%",
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
