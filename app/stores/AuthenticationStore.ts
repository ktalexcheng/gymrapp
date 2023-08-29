import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { Instance, SnapshotOut, flow, getEnv, types } from "mobx-state-tree"
import { AppLanguage, AuthStoreError, WeightUnit } from "../data/constants"
import { User } from "../data/model"
import { Env } from "../utils/expo"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

function isFirebaseUser(value: any): value is FirebaseAuthTypes.User {
  if (value === undefined) return false
  return (value as FirebaseAuthTypes.User).uid !== undefined
}

const FirebaseUserType = createCustomType<FirebaseAuthTypes.User>("FirebaseUser", isFirebaseUser)

GoogleSignin.configure({
  webClientId: Env.GOOGLE_CLIENT_ID,
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
      appLocale: AppLanguage.en_US, // TODO: Default to match user system setting
    },
  } as User
}

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    firebaseUser: FirebaseUserType,
    isAuthenticating: true,
  })
  .volatile((_) => ({
    loginEmail: "",
    loginPassword: "",
    newFirstName: "",
    newLastName: "",
    authError: "",
  }))
  .views((self) => ({
    // isAuthenticated() checks if firebaseUser exists in store
    // firebaseUser can only exist if we got the credentials from Firebase
    get isAuthenticated() {
      return !self.isAuthenticating && !!self.firebaseUser
    },
    get signInCredentialsError() {
      switch (true) {
        case self.loginEmail.length === 0:
          return AuthStoreError.EmailMissingError
        case self.loginEmail.length < 6:
          return AuthStoreError.EmailLengthError
        case !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.loginEmail):
          return AuthStoreError.EmailInvalidError
        case self.loginPassword.length === 0:
          return AuthStoreError.PasswordMissingError
        default:
          return null
      }

      // if (self.loginEmail.length === 0) return AuthStoreError.EmailMissingError
      // if (self.loginEmail.length < 6) return AuthStoreError.EmailLengthError
      // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.loginEmail))
      //   return AuthStoreError.EmailInvalidError
      // if (self.loginPassword.length === 0) return AuthStoreError.PasswordMissingError

      // return null
    },
    get signUpInfoError() {
      switch (true) {
        case self.newFirstName.length === 0:
          return AuthStoreError.FirstNameMissingError
        case self.newLastName.length === 0:
          return AuthStoreError.LastNameMissingError
        default:
          return null
      }

      // if (self.newFirstName.length === 0) return AuthStoreError.FirstNameMissingError
      // if (self.newLastName.length === 0) return AuthStoreError.LastNameMissingError

      // return null
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    catchAuthError(caller, error) {
      console.error("AuthenticationStore.catchAuthError called from", caller, ":", error)
      // Just in case an unexpected error is encountered
      if (!("code" in error)) {
        self.authError = error.toString()
        return
      }

      // auth() errors should be one of the following
      switch (error.code) {
        case "auth/email-already-in-use":
          self.authError = AuthStoreError.EmailDuplicateError
          break
        case "auth/user-not-found":
          self.authError = AuthStoreError.UserNotFoundError
          break
        case "auth/invalid-email":
          self.authError = AuthStoreError.EmailInvalidError
          break
        case "auth/wrong-password":
          self.authError = AuthStoreError.PasswordWrongError
          break
        case "auth/too-many-requests":
          self.authError = AuthStoreError.TooManyRequestsError
          break
        default:
          self.authError = error.toString()
      }
    },
  }))
  .actions((self) => ({
    setFirebaseUser(firebaseUser: FirebaseAuthTypes.User) {
      self.isAuthenticating = true
      if (!firebaseUser) throw new Error("AuthenticationStore.setFirebaseUser failed")
      self.firebaseUser = firebaseUser
      self.isAuthenticating = false
    },
    setLoginEmail(email: string) {
      self.loginEmail = email
    },
    setLoginPassword(password: string) {
      self.loginPassword = password
    },
    setNewFirstName(firstName: string) {
      self.newFirstName = firstName
    },
    setNewLastName(lastName: string) {
      self.newLastName = lastName
    },
    invalidateSession() {
      if (self.firebaseUser) {
        auth()
          .signOut()
          .catch((e) => self.catchAuthError("invalidateSession", e))
        self.firebaseUser = undefined
      }

      // try {
      //   getEnv<RootStoreDependencies>(self).userRepository.logout()
      // } catch (e) {
      //   console.error("AuthenticationStore.invalidateSession error:", e)
      // }
    },
    resetAuthError() {
      self.authError = undefined
    },
  }))
  // Utility actions are defined first to be used in actions below
  .actions((self) => ({
    logout() {
      self.invalidateSession()
    },
    deleteAccount: flow(function* () {
      try {
        yield getEnv<RootStoreDependencies>(self).userRepository.delete(self.firebaseUser.uid)
        yield auth().currentUser.delete() // Also signs user out
        self.invalidateSession()
      } catch (error) {
        self.catchAuthError("deleteAccount", error)
      }
    }),
    signInWithEmail: flow(function* () {
      if (self.signInCredentialsError) return

      self.isAuthenticating = true

      try {
        const userCred = yield auth()
          .signInWithEmailAndPassword(self.loginEmail, self.loginPassword)
          .catch((e) => self.catchAuthError("signInWithEmail", e))

        if (userCred) {
          self.setFirebaseUser(userCred.user)
        }

        self.isAuthenticating = false
      } catch (e) {
        console.error("AuthenticationStore.signInWithEmail error:", e)
      }
    }),
    signUpWithEmail: flow(function* () {
      if (self.signInCredentialsError) return

      self.isAuthenticating = true

      try {
        const userCred = yield auth()
          .createUserWithEmailAndPassword(self.loginEmail, self.loginPassword)
          .catch((e) => self.catchAuthError("signUpWithEmail", e))

        if (userCred) {
          self.setFirebaseUser(userCred.user)
          yield getEnv<RootStoreDependencies>(self).userRepository.create({
            userId: userCred.user.uid,
            privateAccount: true,
            email: userCred.user.email,
            firstName: self.newFirstName,
            lastName: self.newLastName,
            providerId: userCred.additionalUserInfo?.providerId ?? "",
            preferences: {
              appLocale: AppLanguage.en_US, // TODO: Default to match user system setting
              weightUnit: WeightUnit.kg,
            },
            avatarUrl: null, // TODO: Allow user to upload profile picture
          } as User)
        }

        self.isAuthenticating = false
      } catch (e) {
        console.error("AuthenticationStore.signUpWithEmail error:", e)
      }
    }),
    signInWithGoogle: flow(function* () {
      self.isAuthenticating = true

      try {
        // Check if your device supports Google Play
        yield GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
        // Get the users ID token
        const { idToken } = yield GoogleSignin.signIn()
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken)
        // Sign-in the user with the credential
        const userCred = yield auth().signInWithCredential(googleCredential)

        self.setFirebaseUser(userCred.user)

        if (userCred.additionalUserInfo.isNewUser) {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv<RootStoreDependencies>(self).userRepository.create(user)
        }

        self.isAuthenticating = false
      } catch (error) {
        self.catchAuthError("signInWithGoogle", error)
      }
      return null
    }),
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
