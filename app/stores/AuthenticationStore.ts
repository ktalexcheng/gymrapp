import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { defaultAppLocale } from "app/utils/appLocale"
import * as AppleAuthentication from "expo-apple-authentication"
import Constants from "expo-constants"
import * as Crypto from "expo-crypto"
import { Instance, SnapshotOut, flow, getEnv, types } from "mobx-state-tree"
import { AuthErrorType } from "../data/constants"
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
      appLocale: defaultAppLocale(),
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
      return !!self.authToken && self.isEmailVerified
    },
    get isPendingVerification() {
      return !!self.authToken && !self.isEmailVerified
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
          console.error("AuthenticationStore.catchAuthError called from", caller, ":", {
            error,
            ...error,
          })
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

    function resetAuthError() {
      self.authError = ""
    }

    const invalidateSession = flow(function* () {
      resetAuthError()
      if (auth().currentUser) {
        try {
          yield auth().signOut()
        } catch (e) {
          catchAuthError("invalidateSession error:", e)
        }
      }
      self.firebaseUserCredential = undefined
      self.authToken = undefined
    })

    // @ts-ignore
    const refreshAuthToken = flow(function* () {
      self.isAuthenticating = true
      try {
        let token
        if (auth().currentUser) token = yield auth().currentUser?.getIdToken(true)

        if (token) {
          self.authToken = token
        } else {
          console.debug("AuthenticationStore.refreshAuthToken received invalid token:", token)
          yield invalidateSession()
        }
      } catch (e) {
        yield invalidateSession()
        console.error(
          "AuthenticationStore.refreshAuthToken failed to refresh token, invaliding session:",
          e,
        )
      } finally {
        self.isAuthenticating = false
      }
    })

    // @ts-ignore
    const checkEmailVerified = flow(function* () {
      self.isAuthenticating = true
      try {
        yield auth().currentUser?.reload()
        self.isEmailVerified = auth().currentUser?.emailVerified ?? false
        yield refreshAuthToken()
      } catch (e) {
        console.error("AuthenticationStore.checkEmailVerified error:", e)
      } finally {
        self.isAuthenticating = false
      }
    })

    // This is specifically to only overwrite the user property of firebaseUserCredential
    // because for some reason that is what onAuthStateChanged() returns
    function setFirebaseUser(firebaseUser: FirebaseAuthTypes.User) {
      self.isAuthenticating = true
      if (!firebaseUser) {
        throw new Error("AuthenticationStore.setFirebaseUser error: invalid firebaseUser")
      }
      self.firebaseUserCredential = {
        user: {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerId,
        },
      }
      console.debug("AuthenticationStore.setFirebaseUser firebaseUser:", firebaseUser)
      console.debug(
        "AuthenticationStore.setFirebaseUser firebaseUserCredential:",
        self.firebaseUserCredential,
      )
      self.isEmailVerified = firebaseUser.emailVerified
      refreshAuthToken()
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
          providerId: firebaseUserCredential.user.providerId,
        },
      }
      self.isEmailVerified = firebaseUserCredential.user.emailVerified
      refreshAuthToken()
      self.isAuthenticating = false
    }

    const logout = flow(function* () {
      self.isAuthenticating = true
      yield invalidateSession()
      self.isAuthenticating = false
    })

    // @ts-ignore
    const deleteAccount = flow(function* () {
      if (!self.userId) return

      resetAuthError()
      self.isAuthenticating = true
      try {
        yield getEnv<RootStoreDependencies>(self).userRepository.delete(self.userId)
        yield auth().currentUser?.delete() // Also signs user out
        yield invalidateSession()
      } catch (error) {
        catchAuthError("deleteAccount", error)
      } finally {
        self.isAuthenticating = false
      }
    })

    const signInWithEmail = flow(function* () {
      resetAuthError()
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

    // @ts-ignore
    const signUpWithEmail = flow(function* () {
      resetAuthError()
      if (emailIsInvalid(self.loginEmail) || passwordIsWeak(self.loginPassword)) return

      self.isAuthenticating = true

      try {
        yield auth().createUserWithEmailAndPassword(self.loginEmail, self.loginPassword)

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

    const signInWithGoogle = flow(function* () {
      resetAuthError()
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
        // Get the users ID token
        const { idToken } = yield GoogleSignin.signIn()
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken)
        // Sign-in the user with the credential
        const userCred = yield auth().signInWithCredential(googleCredential)
        console.debug("AuthenticationStore.signInWithGoogle success:", !!userCred)

        setFirebaseUserCredential(userCred)

        if (userCred.additionalUserInfo.isNewUser) {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv<RootStoreDependencies>(self).userRepository.create(user)
        }
      } catch (error) {
        catchAuthError("signInWithGoogle", error)
      } finally {
        self.isAuthenticating = false
      }

      return null
    })

    const signInWithApple = flow(function* () {
      resetAuthError()
      self.isAuthenticating = true

      const appleAuthAvailable = yield AppleAuthentication.isAvailableAsync()
      if (!appleAuthAvailable) {
        // console.error("AuthenticationStore.signInWithApple error: Apple login is not available")
        catchAuthError("signInWithApple", "Apple login is not available")
        self.isAuthenticating = false
        return
      }

      try {
        const state = Math.random().toString(36).substring(2, 15)
        const nonce = Math.random().toString(36).substring(2, 10)
        const hashedNonce = yield Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          nonce,
        )
        const appleCredential = (yield AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          state,
          nonce: hashedNonce,
        })) as AppleAuthentication.AppleAuthenticationCredential

        const { identityToken } = appleCredential
        if (!identityToken) {
          // console.error("AuthenticationStore.signInWithApple error: identityToken is null")
          catchAuthError("signInWithApple", "identityToken is null")
          return
        }

        const firebaseCredential = auth.AppleAuthProvider.credential(identityToken, nonce)
        const userCred = yield auth().signInWithCredential(firebaseCredential)
        console.debug("AuthenticationStore.signInWithApple success:", !!userCred)

        setFirebaseUserCredential(userCred)

        if (userCred.additionalUserInfo.isNewUser) {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv<RootStoreDependencies>(self).userRepository.create(user)
        }
      } catch (e) {
        // console.error("AuthenticationStore.signInWithApple error:", e)
        catchAuthError("signInWithApple", e)
      } finally {
        self.isAuthenticating = false
      }

      return null
    })

    return {
      emailIsInvalid,
      passwordIsWeak,
      setLoginEmail,
      setLoginPassword,
      setNewFirstName,
      setNewLastName,
      resetAuthError,
      invalidateSession,
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
