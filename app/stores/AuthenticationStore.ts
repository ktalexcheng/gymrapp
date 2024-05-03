import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import crashlytics from "@react-native-firebase/crashlytics"
import { GoogleSignin, User as GoogleSigninUser } from "@react-native-google-signin/google-signin"
import { translate } from "app/i18n"
import { logError } from "app/utils/logger"
import * as AppleAuthentication from "expo-apple-authentication"
import Constants from "expo-constants"
import * as Crypto from "expo-crypto"
import i18n from "i18n-js"
import { toJS } from "mobx"
import { flow, getEnv, Instance, SnapshotOut, types } from "mobx-state-tree"
import { Alert } from "react-native"
import { AppLocale, AuthErrorType } from "../data/constants"
import { User } from "../data/types"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

// See why: https://rnfirebase.io/auth/social-auth#google
GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.googleOauthClientId,
})

function createUserFromFirebaseUserCred(firebaseUserCred: FirebaseAuthTypes.UserCredential): User {
  return {
    userId: firebaseUserCred.user.uid,
    privateAccount: true,
    email: firebaseUserCred.user.email,
    firstName: firebaseUserCred.additionalUserInfo?.profile?.given_name ?? "",
    lastName: firebaseUserCred.additionalUserInfo?.profile?.family_name ?? "",
    providerId: firebaseUserCred.additionalUserInfo?.providerId ?? "",
    avatarUrl: firebaseUserCred.user?.photoURL ?? "",
    preferences: {
      appLocale: i18n.locale as AppLocale,
    },
  } as User
}

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    isAuthenticating: false,
    // This is a partial implementation of FirebaseAuthTypes.UserCredential, only what we need
    firebaseUserCredential: types.maybe(
      types.model("FirebaseUserCredentialModel", {
        user: types.model("FirebaseUserModel", {
          uid: types.string,
          displayName: types.maybeNull(types.string),
          email: types.maybeNull(types.string),
          emailVerified: false,
          photoURL: types.maybeNull(types.string),
          providerId: types.string,
        }),
      }),
    ),
    authToken: types.maybe(types.string),
    isEmailVerified: false,
  })
  .volatile(() => ({
    loginEmail: "",
    loginPassword: "",
    newFirstName: "",
    newLastName: "",
    authError: "",
  }))
  .views((self) => ({
    get isAuthenticated() {
      // For providers other than email/password (e.g. Google, Apple), we assume the user is authenticated
      return (
        !!self.authToken &&
        (self.firebaseUserCredential?.user?.providerId !== "password" ||
          (self.firebaseUserCredential?.user?.providerId === "password" && self.isEmailVerified))
      )
    },
    get isPendingVerification() {
      // Email verification is only required for email/password users
      return self.firebaseUserCredential?.user?.providerId === "password" && !self.isEmailVerified
    },
    get userId() {
      return self.firebaseUserCredential?.user?.uid ?? null
    },
    get firstName() {
      return self.firebaseUserCredential?.user?.displayName?.split(" ")[0] ?? ""
    },
    get lastName() {
      return self.firebaseUserCredential?.user?.displayName?.split(" ")[1] ?? ""
    },
    get avatarUrl() {
      return self.firebaseUserCredential?.user?.photoURL ?? ""
    },
    get email() {
      return self.firebaseUserCredential?.user?.email ?? ""
    },
    get providerId() {
      return self.firebaseUserCredential?.user?.providerId ?? ""
    },
  }))
  .actions(withSetPropAction)
  // Declaring these actions separately so that they can be used in other actions
  .actions((self) => {
    const resetAuthError = () => {
      self.authError = ""
    }

    const resetAuthStore = () => {
      resetAuthError()
      self.firebaseUserCredential = undefined
      self.authToken = undefined
      self.isEmailVerified = false
    }

    return {
      resetAuthError,
      resetAuthStore,
    }
  })
  .actions((self) => {
    function catchAuthError(caller, error) {
      // console.error("AuthenticationStore.catchAuthError:", { caller, error })
      // expo-apple-authentication errors if login is aborted
      // ERR_REQUEST_UNKNOWN can happen when the user is not signed in to iCloud on iOS
      // ERR_REQUEST_CANCELED can happen when the user is signed in to iCloud on iOS but cancels the login
      if (error?.code === "ERR_REQUEST_CANCELED" || error?.code === "ERR_REQUEST_UNKNOWN") {
        self.authError = AuthErrorType.LoginCancelledError
        return
      }

      // react-native-google-signin errors if login is aborted
      if (error?.domain === "com.google.GIDSignIn" && error?.code === "-5") {
        self.authError = AuthErrorType.LoginCancelledError
        return
      }

      // firebase.auth() errors should be one of the following
      switch (error?.code) {
        case "auth/email-already-in-use":
          self.authError = AuthErrorType.EmailAlreadyInUseError
          break
        case "auth/user-not-found":
          self.authError = AuthErrorType.UserNotFoundError
          break
        case "auth/invalid-credential":
          self.authError = AuthErrorType.InvalidCredentialsError
          break
        case "auth/invalid-email":
          self.authError = AuthErrorType.EmailInvalidError
          break
        case "auth/wrong-password":
          self.authError = AuthErrorType.PasswordWrongError
          break
        case "auth/too-many-requests":
          self.authError = AuthErrorType.TooManyRequestsError
          break
        case "auth/network-request-failed":
          self.authError = AuthErrorType.NetworkError
          break
        default:
          // Just in case an unexpected error is encountered
          logError(error, "AuthenticationStore.catchAuthError unexpected error", { caller })
          self.authError = AuthErrorType.UnknownError
      }
    }

    // Use this in the authentication stack to prevent bad requests
    function emailIsInvalid(email: string) {
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    // Use this in the authentication stack to prevent bad requests
    function passwordIsWeak(password: string) {
      return (
        password.length < 8 ||
        !/[a-z]/.test(password) || // checks for lowercase letter
        !/[A-Z]/.test(password) || // checks for uppercase letter
        !/[0-9]/.test(password) // checks for number
      )
    }

    function setLoginEmail(email: string) {
      self.loginEmail = email
    }

    function setLoginPassword(password: string) {
      self.loginPassword = password
    }

    function setNewFirstName(firstName: string) {
      self.newFirstName = firstName
    }

    function setNewLastName(lastName: string) {
      self.newLastName = lastName
    }

    // @ts-ignore: Not all paths return a value, but we don't need a return value
    const refreshAuthToken = flow(function* () {
      self.isAuthenticating = true
      try {
        let token
        if (auth().currentUser) token = yield auth().currentUser?.getIdToken(true)

        if (token) {
          self.authToken = token
        } else {
          console.debug("AuthenticationStore.refreshAuthToken received invalid token:", token)
          self.resetAuthStore()
        }
      } catch (e) {
        if (e) self.resetAuthStore()
        console.debug(
          "AuthenticationStore.refreshAuthToken failed to refresh token, invaliding session:",
          e,
        )
      } finally {
        self.isAuthenticating = false
      }
    })

    // @ts-ignore: Not all paths return a value, but we don't need a return value
    const checkEmailVerified = flow(function* () {
      self.isAuthenticating = true
      try {
        yield auth().currentUser?.reload()
        console.debug("AuthenticationStore.checkEmailVerified() currentUser:", auth().currentUser)
        self.isEmailVerified = auth().currentUser?.emailVerified ?? false
        yield refreshAuthToken()
      } catch (e) {
        logError(e, "AuthenticationStore.checkEmailVerified error")
      } finally {
        self.isAuthenticating = false
      }
    })

    // This is specifically to only overwrite the user property of firebaseUserCredential
    // because for some reason that is what onAuthStateChanged() returns
    function setFirebaseUser(firebaseUser: FirebaseAuthTypes.User) {
      if (!firebaseUser) {
        throw new Error("AuthenticationStore.setFirebaseUser error: invalid firebaseUser")
      }

      self.isAuthenticating = true
      self.firebaseUserCredential = {
        user: {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerData[0].providerId,
        },
      }
      console.debug("AuthenticationStore.setFirebaseUser", {
        firebaseUser,
        firebaseUserCredential: self.firebaseUserCredential,
      })
      self.isEmailVerified = firebaseUser.emailVerified
      refreshAuthToken()
      crashlytics().setUserId(firebaseUser.uid)
      self.isAuthenticating = false
    }

    function setFirebaseUserCredential(firebaseUserCredential: FirebaseAuthTypes.UserCredential) {
      self.isAuthenticating = true
      if (!firebaseUserCredential) {
        console.warn(
          "AuthenticationStore.setFirebaseUserCredential error: invalid firebaseUserCredential",
        )
      }
      console.debug(
        "AuthenticationStore.setFirebaseUserCredential firebaseUserCredential:",
        firebaseUserCredential,
      )

      self.firebaseUserCredential = {
        user: {
          uid: firebaseUserCredential.user.uid,
          displayName: firebaseUserCredential.user.displayName,
          email: firebaseUserCredential.user.email,
          emailVerified: firebaseUserCredential.user.emailVerified,
          photoURL: firebaseUserCredential.user.photoURL,
          // providerId on the user object is always "firebase", we want the providerId from the additionalUserInfo which will say "apple.com" or "google.com"
          providerId:
            firebaseUserCredential?.additionalUserInfo?.providerId ||
            firebaseUserCredential.user.providerId,
        },
      }
      self.isEmailVerified = firebaseUserCredential.user.emailVerified
      refreshAuthToken()
      self.isAuthenticating = false
    }

    const logout = flow(function* () {
      self.isAuthenticating = true
      if (auth().currentUser) {
        try {
          yield auth().signOut()
          self.resetAuthStore()
        } catch (e) {
          catchAuthError("logout error:", e)
        }
      }
      self.isAuthenticating = false
    })

    const signInWithEmail = flow(function* () {
      self.resetAuthStore()
      if (emailIsInvalid(self.loginEmail) || passwordIsWeak(self.loginPassword)) return

      self.isAuthenticating = true

      try {
        const userCred = yield auth().signInWithEmailAndPassword(
          self.loginEmail,
          self.loginPassword,
        )

        if (userCred) {
          setFirebaseUserCredential(userCred)
        }
      } catch (e) {
        catchAuthError("signInWithEmail", e)
        // We still throw the error here so that the call site SignUpScreen can handle it
        throw e
      } finally {
        self.isAuthenticating = false
      }
    })

    // @ts-ignore: Not all paths return a value, but we don't need a return value
    const signUpWithEmail = flow(function* () {
      self.resetAuthStore()
      if (emailIsInvalid(self.loginEmail) || passwordIsWeak(self.loginPassword)) return

      self.isAuthenticating = true

      try {
        const userCred = yield auth().createUserWithEmailAndPassword(
          self.loginEmail,
          self.loginPassword,
        )
        const user = createUserFromFirebaseUserCred(userCred) // This will be missing first name and last name
        getEnv<RootStoreDependencies>(self).userRepository.setUserId(user.userId)
        yield getEnv<RootStoreDependencies>(self).userRepository.create({
          ...toJS(user),
          firstName: self.newFirstName,
          lastName: self.newLastName,
        })
        console.debug("AuthenticationStore.signUpWithEmail created new user:", user)

        // IMPORTANT: Firebase Dynamic Links had to be set up for this to work on iOS (it works without Dynamic Links on Android)
        // but Dynamic Links are deprecated by Firebase and will be removed by August 25, 2025
        // https://gymrapp.page.link/email-verified is a Firebase Dynamic Link that redirects to https://gymrapp.com/auth/email-verified
        yield auth().currentUser?.sendEmailVerification({
          url: `${process.env.EXPO_PUBLIC_GYMRAPP_BASE_URL}/auth/email-verified`,
        })
      } catch (e) {
        catchAuthError("signUpWithEmail", e)
        // We still throw the error here so that the call site SignUpScreen can handle it
        throw e
      } finally {
        self.isAuthenticating = false
      }
    })

    const getGoogleCredential = async () => {
      // Get the users ID token
      const googleCredential = await GoogleSignin.signIn()
      return googleCredential
    }

    const signInWithGoogle = flow(function* () {
      self.resetAuthStore()
      self.isAuthenticating = true
      console.debug("AuthenticationStore.signInWithGoogle called")

      // Check if your device supports Google Play
      const hasPlayServices = yield GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      })
      if (!hasPlayServices) {
        // console.error(
        //   "AuthenticationStore.signInWithGoogle error: Google Play Services are not available",
        // )
        catchAuthError("signInWithGoogle", "Google Play Services are not available")
        self.isAuthenticating = false
        return
      }

      try {
        const googleCredential = yield getGoogleCredential()
        const firebaseCredential = auth.GoogleAuthProvider.credential(googleCredential.idToken)
        const userCred = yield auth().signInWithCredential(firebaseCredential)
        console.debug("AuthenticationStore.signInWithGoogle success:", !!userCred)

        setFirebaseUserCredential(userCred)

        if (userCred.additionalUserInfo.isNewUser) {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv<RootStoreDependencies>(self).userRepository.setUserId(user.userId)
          yield getEnv<RootStoreDependencies>(self).userRepository.create({
            ...toJS(user),
            googleUserId: googleCredential.user.id,
          })
          console.debug("AuthenticationStore.signInWithGoogle created new user:", user)
        }
      } catch (error) {
        catchAuthError("signInWithGoogle", error)
      } finally {
        self.isAuthenticating = false
      }

      return null
    })

    // Apple login requires a nonce for authentication
    // This is shared between signInWithApple and getAppleCredential
    const nonce = Math.random().toString(36).substring(2, 10)

    const getAppleCredential = async () => {
      const state = Math.random().toString(36).substring(2, 15)
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce)
      const appleCredential = (await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state,
        nonce: hashedNonce,
      })) as AppleAuthentication.AppleAuthenticationCredential
      console.debug("AuthenticationStore.getAppleCredential appleCredential:", appleCredential)

      return appleCredential
    }

    const signInWithApple = flow(function* () {
      self.resetAuthStore()
      self.isAuthenticating = true

      const appleAuthAvailable = yield AppleAuthentication.isAvailableAsync()
      if (!appleAuthAvailable) {
        catchAuthError("signInWithApple", "Apple login is not available")
        self.isAuthenticating = false
        return
      }

      try {
        const appleCredential = yield getAppleCredential()
        console.debug("AuthenticationStore.signInWithApple appleCredential:", appleCredential)

        // See: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple
        // When someone uses your app and Sign in with Apple for the first time, the identification servers return the user status.
        // Subsequent attempts don’t return the user status. So we need to store all the user data at this point
        let lastName, firstName, nickname
        if (appleCredential) {
          const { fullName } = appleCredential
          lastName = fullName?.familyName
          firstName = fullName?.givenName
          nickname = fullName?.nickname
        }

        const { identityToken } = appleCredential
        if (!identityToken) {
          catchAuthError("signInWithApple", "identityToken is null")
          return
        }

        const firebaseCredential = auth.AppleAuthProvider.credential(identityToken, nonce)
        // This is technically the second time we are signing in with Apple
        const userCred = yield auth().signInWithCredential(firebaseCredential)
        setFirebaseUserCredential(userCred)

        if (userCred.additionalUserInfo.isNewUser) {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv<RootStoreDependencies>(self).userRepository.setUserId(user.userId)
          getEnv<RootStoreDependencies>(self).userRepository.create({
            ...toJS(user),
            // When the user deletes their account and logs in again, these fields will not be available
            email: user.email ?? "",
            firstName: nickname ?? firstName ?? "",
            lastName: lastName ?? "",
            appleUserId: appleCredential.user,
          })
        }
      } catch (e) {
        // console.error("AuthenticationStore.signInWithApple error:", e)
        catchAuthError("signInWithApple", e)
      } finally {
        self.isAuthenticating = false
      }

      return null
    })

    // @ts-ignore: Not all paths return a value, but we don't need a return value
    const deleteAccount = flow(function* (password?: string) {
      if (!self.userId) return

      self.isAuthenticating = true
      // try {
      //   yield getEnv<RootStoreDependencies>(self).userRepository.delete(self.userId)
      // } catch (e) {
      //   logError(e, "AuthenticationStore.deleteAccount() error deleting user document")
      // }

      try {
        // Auth delete requires recent sign-in, here we reauthenticate the user
        // console.debug("AuthenticationStore.deleteAccount()", {
        //   providerId: self.providerId,
        //   currentUser: auth().currentUser,
        //   password,
        // })
        let userCred: FirebaseAuthTypes.UserCredential
        let googleCredential: GoogleSigninUser
        let googleFirebaseCredential: FirebaseAuthTypes.AuthCredential
        let appleCredential: AppleAuthentication.AppleAuthenticationCredential
        let appleFirebaseCredential: FirebaseAuthTypes.AuthCredential
        switch (self.providerId) {
          case "google.com":
            googleCredential = yield getGoogleCredential()
            googleFirebaseCredential = auth.GoogleAuthProvider.credential(googleCredential.idToken)
            userCred = yield auth().currentUser?.reauthenticateWithCredential(
              googleFirebaseCredential,
            )

            break
          case "apple.com":
            appleCredential = yield getAppleCredential()
            appleFirebaseCredential = auth.AppleAuthProvider.credential(
              appleCredential.identityToken,
              nonce,
            )
            userCred = yield auth().currentUser?.reauthenticateWithCredential(
              appleFirebaseCredential,
            )

            break
          case "password":
            console.debug("AuthenticationStore.deleteAccount()", { email: self.email, password })
            userCred = yield auth().currentUser?.reauthenticateWithCredential(
              auth.EmailAuthProvider.credential(self.email, password!),
            )

            break
          default:
            throw new Error("AuthenticationStore.deleteAccount() error: unknown providerId")
        }

        console.debug("AuthenticationStore.deleteAccount()", { userCred })
        Alert.alert(
          translate("userSettingsScreen.deleteFinalWarningTitle"),
          translate("userSettingsScreen.deleteFinalWarningMessage"),
          [
            {
              text: translate("common.cancel"),
              style: "cancel",
            },
            {
              text: translate("common.delete"),
              style: "destructive",
              onPress: () => {
                // Delete also signs user out so no need to call logout()
                auth()
                  .currentUser?.delete()
                  .then(() => {
                    console.debug("AuthenticationStore.deleteAccount() account is deleted")
                    self.resetAuthStore()
                  })
              },
            },
          ],
        )
      } catch (e: any) {
        console.debug("AuthenticationStore.deleteAccount() error:", e)
        if (
          [
            "auth/requires-recent-login",
            "auth/invalid-credential",
            "auth/user-mismatch",
            "auth/too-many-requests",
          ].includes(e?.code)
        ) {
          let errorMessage = translate("userSettingsScreen.identityVerificationFailedMessage")
          switch (e?.code) {
            case "auth/user-mismatch":
              errorMessage = translate("userSettingsScreen.identityMismatchMessage")
              break
            case "auth/too-many-requests":
              errorMessage = translate("userSettingsScreen.tooManyFailedAttemptsMessage")
              break
          }

          Alert.alert(
            translate("userSettingsScreen.identityVerificationFailedTitle"),
            errorMessage,
            [
              {
                text: translate("common.ok"),
                style: "cancel",
              },
            ],
          )
        } else {
          catchAuthError("deleteAccount", e)
        }
      }

      self.isAuthenticating = false
    })

    return {
      emailIsInvalid,
      passwordIsWeak,
      setLoginEmail,
      setLoginPassword,
      setNewFirstName,
      setNewLastName,
      refreshAuthToken,
      checkEmailVerified,
      setFirebaseUser,
      setFirebaseUserCredential,
      logout,
      deleteAccount,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
    }
  })

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
