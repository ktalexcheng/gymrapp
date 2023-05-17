import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { Instance, SnapshotOut, flow, types } from "mobx-state-tree"
import { Env } from "../services/expo"

// To satisfy type definition of model properties
const FirebaseUserType = types.custom<any, FirebaseAuthTypes.User>({
  name: "FirebaseUser",
  fromSnapshot(value: string) {
    if (value) {
      const obj = JSON.parse(value)
      return {
        ...obj
      } as FirebaseAuthTypes.User
    } else {
      return undefined
    }
  },
  toSnapshot(value: FirebaseAuthTypes.User) {
    if (value) {
      return JSON.stringify(value)
    } else {
      return undefined
    }
  },
  isTargetType(value: any) {
    return value instanceof Object && 'uid' in value
  },
  getValidationMessage(value: any) {
    if (!(value instanceof Object)) return ""
    return `"${value}" does not look like a FirebaseAuthTypes.User type`
  }
})

enum AuthStoreError {
  EmailMissingError = "Email is not provided",
  EmailDuplicateError = "Email is already in use",
  EmailInvalidError = "Email is invalid",
  EmailLengthError = "Email is too short",
  PasswordMissingError = "Password is not set",
  PasswordWrongError = "Password is wrong",
  UserNotFoundError = "User not found",
  TooManyRequestsError = "Too many failed attempts, please try again later",
  GenericError = "Something went wrong during authentication"
}

GoogleSignin.configure({
  webClientId: Env.GOOGLE_CLIENT_ID,
})

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authEmail: "",
    authPassword: "",
    user: FirebaseUserType,
    storeError: types.optional(types.maybeNull(types.string), null)
  })
  .views((self) => ({
    get isAuthenticated() {
      return !!self.user
    },
    get validationError() {
      if (self.authEmail.length === 0) return AuthStoreError.EmailMissingError
      if (self.authEmail.length < 6) return AuthStoreError.EmailLengthError
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.authEmail))
        return AuthStoreError.EmailInvalidError
      if (self.authPassword.length === 0) return AuthStoreError.PasswordMissingError

      return null
    },
  }))
  .actions((self) => ({
    setAuthEmail(value: string) {
      self.authEmail = value.replace(/ /g, "")
    },
    setAuthPassword(value: string) {
      self.authPassword = value.replace(/ /g, "")
    },
    setUser(userCred: FirebaseAuthTypes.UserCredential) {
      if (userCred) self.user = userCred.user
      else self.user = null
    },
    setError(value: AuthStoreError) {
      self.storeError = value
    },
    catchAuthError(error) {
      // Just in case an unexpected error is encountered
      if (!('code' in error)) {
        self.storeError = error.toString()
        return
      }
      
      // auth() errors should be one of the following
      switch(error.code) {
        case 'auth/email-already-in-use': 
          self.storeError = AuthStoreError.EmailDuplicateError
          break
        case 'auth/user-not-found':
          self.storeError = AuthStoreError.UserNotFoundError
          break
        case 'auth/invalid-email':
          self.storeError = AuthStoreError.EmailInvalidError
          break
        case 'auth/wrong-password':
          self.storeError = AuthStoreError.PasswordWrongError
          break
        case 'auth/too-many-requests':
          self.storeError = AuthStoreError.TooManyRequestsError
          break
        default:
          self.storeError = error.toString()
      }
    },
  }))
  // Utility actions are defined first to be used in async actions below
  .actions((self) => ({
    logout() {
      auth().signOut()
      self.authEmail = ""
      self.authPassword = ""
      self.user = undefined
    },
    signInWithEmail() {
      if (self.validationError) return

      auth()
        .signInWithEmailAndPassword(self.authEmail, self.authPassword)
        .then(self.setUser)
        .catch(self.catchAuthError)
    },
    signUpWithEmail() {
      if (self.validationError) return

      auth()
        .createUserWithEmailAndPassword(self.authEmail, self.authPassword)
        .then(self.setUser)
        .catch(self.catchAuthError)
    },
    signInWithGoogle: flow(function* () {
      try {
        // Check if your device supports Google Play
        yield GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
        // Get the users ID token
        const { idToken } = yield GoogleSignin.signIn()
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken)
        // Sign-in the user with the credential
        auth()
          .signInWithCredential(googleCredential)
          .then(self.setUser)
      } catch (error) {
        self.catchAuthError(error)
      }
      return null
    })
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
