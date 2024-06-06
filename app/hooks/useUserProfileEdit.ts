import { useLocale } from "app/context"
import {
  AppColorScheme,
  AppLocale,
  DefaultUserPreferences,
  UserErrorType,
  WeightUnit,
} from "app/data/constants"
import { Gym, User } from "app/data/types"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { logError } from "app/utils/logger"
import { toJS } from "mobx"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useToast } from "./useToast"

const useUserHandleEdit = (
  initialUserHandle?: string,
): {
  userHandle?: string
  setUserHandle: Dispatch<SetStateAction<string | undefined>>
  userHandleHelper?: string
  userHandleError?: string
  setUserHandleError: Dispatch<SetStateAction<string | undefined>>
} => {
  const { userStore } = useStores()

  const [userHandle, setUserHandle] = useState(initialUserHandle)
  const [userHandleHelper, setUserHandleHelper] = useState<string>()
  const [userHandleError, setUserHandleError] = useState<string>()

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

  console.debug("useUserHandleEdit", { userHandle, userHandleHelper, userHandleError })
  return { userHandle, setUserHandle, userHandleHelper, userHandleError, setUserHandleError }
}

const isValidString = (value: any) => {
  return value && value.length > 0
}

export const useUserProfileEdit = (): {
  userProfile: Partial<User>
  refreshUserProfileFromStore: () => void
  setUserProfile: (user: Partial<User>) => void
  isInvalidUserInfo: () => boolean
  saveUserProfile: () => Promise<void>
  isSaving: boolean
  isSaved: boolean
  isDirty: boolean
  userHandleHelper?: string
  userHandleError?: string
  firstNameMissingError?: string
  lastNameMissingError?: string
} => {
  const { authenticationStore: authStore, userStore } = useStores()
  const initialUser = toJS(userStore.user)

  // Utility hooks
  const { locale } = useLocale()
  const [toastShowTx] = useToast()

  // Internal state
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDirty, setIsDirty] = useState(false) // Check for unsaved changes

  // Saving states
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Input states
  const { userHandle, setUserHandle, userHandleHelper, userHandleError, setUserHandleError } =
    useUserHandleEdit(initialUser?.userHandle ?? "")
  const [privateAccount, setPrivateAccount] = useState(initialUser?.privateAccount ?? true) // Default to true as safety measure
  const [firstName, setFirstName] = useState(initialUser?.firstName ?? "")
  const [lastName, setLastName] = useState(initialUser?.lastName ?? "")
  const [imagePath, setImagePath] = useState(initialUser?.avatarUrl ?? "") // Named imagePath because it could be a local file path when editing
  const [weightUnit, setWeightUnit] = useState(
    initialUser?.preferences?.weightUnit ?? DefaultUserPreferences.weightUnit,
  )
  const [appLocale, setAppLocale] = useState(
    initialUser?.preferences?.appLocale ?? locale ?? DefaultUserPreferences.appLocale,
  )
  const [appColorScheme, setAppColorScheme] = useState(
    initialUser?.preferences?.appColorScheme ?? DefaultUserPreferences.appColorScheme,
  )
  const [autoRestTimerEnabled, setAutoRestTimerEnabled] = useState(
    initialUser?.preferences?.autoRestTimerEnabled ?? DefaultUserPreferences.autoRestTimerEnabled,
  )
  const [restTime, setRestTime] = useState(
    initialUser?.preferences?.restTime ?? DefaultUserPreferences.restTime,
  )
  const [myGyms, setMyGyms] = useState<Gym[]>(initialUser?.myGyms ?? [])

  // Validation states
  const [userHandleMissingError, setUserHandleMissingError] = useState<string>()
  const [firstNameMissingError, setFirstNameMissingError] = useState<string>()
  const [lastNameMissingError, setLastNameMissingError] = useState<string>()

  // const latestUserProfileFromStore = useCallback(() => {
  //   return {
  //     userHandle: userStore.getPropAsJS("user.userHandle"),
  //     privateAccount: userStore.getPropAsJS("user.privateAccount"),
  //     firstName: userStore.getPropAsJS("user.firstName"),
  //     lastName: userStore.getPropAsJS("user.lastName"),
  //     avatarUrl: userStore.getPropAsJS("user.avatarUrl"),
  //     myGyms: userStore.getPropAsJS("user.myGyms"),
  //     preferences: {
  //       weightUnit: userStore.getUserPreference<WeightUnit>("weightUnit"),
  //       appLocale: userStore.getUserPreference<AppLocale>("appLocale"),
  //       appColorScheme: userStore.getUserPreference<AppColorScheme>("appColorScheme"),
  //       autoRestTimerEnabled: userStore.getUserPreference<boolean>("autoRestTimerEnabled"),
  //       restTime: userStore.getUserPreference<number>("restTime"),
  //     },
  //   } as Partial<User>
  // }, [userStore.user])

  const refreshUserProfileFromStore = () => {
    setIsHydrated(false)
  }

  useEffect(() => {
    if (!userStore.user) return

    const userAsJs = toJS(userStore.user)
    if (!isHydrated && !userStore.isLoadingProfile) {
      setUserProfile({
        userHandle: userAsJs.userHandle,
        privateAccount: userAsJs.privateAccount,
        firstName: userAsJs.firstName,
        lastName: userAsJs.lastName,
        avatarUrl: userAsJs.avatarUrl ?? undefined,
        preferences: {
          weightUnit: userAsJs.preferences?.weightUnit,
          appLocale: userAsJs.preferences?.appLocale ?? locale,
          appColorScheme: userAsJs.preferences?.appColorScheme,
          autoRestTimerEnabled: userAsJs.preferences?.autoRestTimerEnabled,
          restTime: userAsJs.preferences?.restTime,
        },
      })

      setIsHydrated(true)
    }

    // Because myGyms are managed differently, we always update it to reflect the latest changes
    setUserProfile({ myGyms: userAsJs.myGyms })
  }, [isHydrated, userStore.isLoadingProfile, userStore.user, locale])

  useEffect(() => {
    if (isValidString(userHandle)) setUserHandleMissingError(undefined)
    if (isValidString(firstName)) setFirstNameMissingError(undefined)
    if (isValidString(lastName)) setLastNameMissingError(undefined)
  }, [userHandle, firstName, lastName])

  useEffect(() => {
    if (isHydrated) setIsDirty(checkForUnsavedChanges())
  }, [
    isHydrated,
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

  const isInvalidUserInfo = () => {
    let errorFound = false

    if (!isValidString(userHandle)) {
      setUserHandleMissingError(
        (prev) => prev || translate("editProfileForm.error.userHandleMissingMessage"),
      )
      errorFound = true
    } else if (userHandleError) {
      errorFound = true
    }

    if (!isValidString(firstName)) {
      setFirstNameMissingError(translate("editProfileForm.error.firstNameMissingMessage"))
      errorFound = true
    }

    if (!isValidString(lastName)) {
      setLastNameMissingError(translate("editProfileForm.error.lastNameMissingMessage"))
      errorFound = true
    }

    return errorFound
  }

  const checkForUnsavedChanges = () => {
    // This seems more complicated to keep track of the changes found but was useful for debug
    const changesFound: string[] = []
    if (userHandle?.toLowerCase() !== userStore.getPropAsJS("user._userHandleLower"))
      changesFound.push("userHandle")
    if (firstName !== userStore.getPropAsJS("user.firstName")) changesFound.push("firstName")
    if (lastName !== userStore.getPropAsJS("user.lastName")) changesFound.push("lastName")
    if (imagePath !== userStore.getPropAsJS("user.avatarUrl")) changesFound.push("avatarUrl")
    if (weightUnit !== userStore.getUserPreference<WeightUnit>("weightUnit"))
      changesFound.push("weightUnit")
    if (privateAccount !== userStore.getPropAsJS("user.privateAccount"))
      changesFound.push("privateAccount")
    if (appLocale !== userStore.getUserPreference<AppLocale>("appLocale"))
      changesFound.push("appLocale")
    if (appColorScheme !== userStore.getUserPreference<AppColorScheme>("appColorScheme"))
      changesFound.push("appColorScheme")
    if (autoRestTimerEnabled !== userStore.getUserPreference<boolean>("autoRestTimerEnabled")) {
      console.debug("autoRestTimerEnabled", autoRestTimerEnabled)
      console.debug(
        "autoRestTimerEnabled ref",
        userStore.getUserPreference<boolean>("autoRestTimerEnabled"),
      )
      changesFound.push("autoRestTimerEnabled")
    }
    if (restTime !== userStore.getUserPreference<number>("restTime")) changesFound.push("restTime")

    console.debug("useUserProfileEdit.checkForUnsavedChanges()", { changesFound })
    if (changesFound.length > 0) return true

    return false
  }

  const saveUserProfile = async () => {
    console.debug("useUserProfileEdit.saveProfile called", {
      _userHandleLower: userHandle!.toLowerCase(),
      userHandle,
      firstName,
      lastName,
      privateAccount,
      myGyms,
      preferences: {
        appLocale,
        weightUnit,
        autoRestTimerEnabled,
        restTime,
        appColorScheme,
      },
    })
    if (isInvalidUserInfo() || !authStore.userId)
      return Promise.reject(new Error("Invalid user info or user not authenticated"))

    try {
      setIsSaving(true)
      setIsSaved(false)

      const user = {
        _userHandleLower: userHandle!.toLowerCase(),
        userHandle,
        firstName,
        lastName,
        privateAccount,
        myGyms,
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

      if (userStore.user) {
        await userStore
          .updateProfile(user)
          .then(() => {
            setIsSaved(true)
          })
          .catch((e: Error) => {
            if (e.cause === UserErrorType.UserHandleAlreadyTakenError) {
              setUserHandleError(translate("editProfileForm.error.userHandleIsTakenMessage"))
            } else {
              logError(e, "useUserProfileEdit.saveProfile error")
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
          setIsSaved(true)
        })
      }
      console.debug("useUserProfileEdit.saveProfile: profile saved successfully")
    } catch (e) {
      logError(e, "useUserProfileEdit.saveProfile error")
    } finally {
      setIsSaving(false)
    }
  }

  const setUserProfile = (user: Partial<User>) => {
    console.debug("useUserProfileEdit.setUserProfile", { user })
    // During editing, it is possible to set the following fields to undefined explicity (e.g. remove avatar)
    // So we check if the key exists in the user object before setting the state
    if ("userHandle" in user) setUserHandle(user.userHandle)
    if ("privateAccount" in user) setPrivateAccount(user.privateAccount ?? true) // Fallback to true as safety measure
    if ("firstName" in user) setFirstName(user.firstName ?? "")
    if ("lastName" in user) setLastName(user.lastName ?? "")
    if ("avatarUrl" in user) setImagePath(user.avatarUrl ?? "")
    if ("myGyms" in user) setMyGyms(user.myGyms ?? [])

    // preferences cannot be undefined, so we use user?.preferences and ignore undefined
    if (user?.preferences) {
      // Preferences could have value "false", so we check for key existence
      if ("weightUnit" in user.preferences) setWeightUnit(user.preferences.weightUnit)
      if ("appLocale" in user.preferences) setAppLocale(user.preferences.appLocale)
      if ("appColorScheme" in user.preferences) setAppColorScheme(user.preferences.appColorScheme)
      if ("autoRestTimerEnabled" in user.preferences)
        setAutoRestTimerEnabled(user.preferences.autoRestTimerEnabled)
      if ("restTime" in user.preferences) setRestTime(user.preferences.restTime)
    }
  }

  const userProfile: Partial<User> = {
    userHandle,
    privateAccount,
    firstName,
    lastName,
    avatarUrl: imagePath,
    myGyms,
    preferences: {
      weightUnit,
      appLocale,
      appColorScheme,
      autoRestTimerEnabled,
      restTime,
    },
  }

  return {
    userProfile,
    refreshUserProfileFromStore,
    setUserProfile,
    isInvalidUserInfo,
    saveUserProfile,
    isSaving,
    isSaved,
    isDirty,
    userHandleHelper,
    userHandleError: userHandleError || userHandleMissingError,
    firstNameMissingError,
    lastNameMissingError,
  }
}
