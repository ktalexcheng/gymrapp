import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { Instance, SnapshotOut, flow, getEnv, types } from "mobx-state-tree"
import { User, isUser } from "../data/model"
import { Env } from "../utils/expo"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

function snapshotToType<T>(value: string): T {
  if (value) {
    const obj = JSON.parse(value)
    return {
      ...obj,
    } as T
  } else {
    return undefined
  }
}

function typeToSnapshot<T>(value: T): string {
  if (value) {
    return JSON.stringify(value)
  } else {
    return undefined
  }
}

function isFirebaseUser(value: any): value is FirebaseAuthTypes.User {
  if (value === undefined) return false
  return (value as FirebaseAuthTypes.User).uid !== undefined
}

const FirebaseUserType = types.custom<any, FirebaseAuthTypes.User>({
  name: "FirebaseUser",
  fromSnapshot(value: string) {
    return snapshotToType<FirebaseAuthTypes.User>(value)
  },
  toSnapshot(value: FirebaseAuthTypes.User) {
    return typeToSnapshot<FirebaseAuthTypes.User>(value)
  },
  isTargetType(value: any) {
    return isFirebaseUser(value)
  },
  getValidationMessage(value: any) {
    if (isFirebaseUser(value) || value === undefined) return ""
    return `"${value}" does not look like a FirebaseAuthTypes.User type`
  },
})

const UserType = types.custom<any, User>({
  name: "User",
  fromSnapshot(value: string) {
    return snapshotToType<User>(value)
  },
  toSnapshot(value: User) {
    return typeToSnapshot<User>(value)
  },
  isTargetType(value: any) {
    return isUser(value)
  },
  getValidationMessage(value: any) {
    if (isUser(value) || value === undefined) return ""
    return `"${value}" does not look like a User type`
  },
})

enum AuthStoreError {
  EmailMissingError = "Email is not provided",
  EmailDuplicateError = "Email is already in use",
  EmailInvalidError = "Email is invalid",
  EmailLengthError = "Email is too short",
  PasswordMissingError = "Password is not set",
  PasswordWrongError = "Password is wrong",
  UserNotFoundError = "User not found",
  UserMissingError = "User is not provided",
  TooManyRequestsError = "Too many failed attempts, please try again later",
  // GenericError = "Something went wrong during authentication",
}

GoogleSignin.configure({
  webClientId: Env.GOOGLE_CLIENT_ID,
})

function createUserFromFirebaseUserCred(firebaseUserCred: FirebaseAuthTypes.UserCredential): User {
  // Create user profile
  const newUser: User = {
    userId: firebaseUserCred.user.uid,
    privateAccount: true,
    email: firebaseUserCred.user.email,
    firstName: firebaseUserCred.additionalUserInfo?.profile?.given_name ?? "",
    lastName: firebaseUserCred.additionalUserInfo?.profile?.family_name ?? "",
    providerId: firebaseUserCred.additionalUserInfo?.providerId ?? "",
    photoUrl: firebaseUserCred.user?.photoURL ?? "",
  }

  return newUser
}

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    user: UserType,
    firebaseUser: FirebaseUserType,
    isLoadingProfile: true,
  })
  .volatile((_) => ({
    loginEmail: "",
    loginPassword: "",
    authError: "",
  }))
  .views((self) => ({
    // isAuthenticated() checks if firebaseUser exists in store
    // firebaseUser can only exist if we got the credentials from Firebase
    get isAuthenticated() {
      return !!self.firebaseUser
    },
    get validationError() {
      if (!self.user) return AuthStoreError.UserMissingError
      if (self.user.email.length === 0) return AuthStoreError.EmailMissingError
      if (self.user.email.length < 6) return AuthStoreError.EmailLengthError
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.user.email))
        return AuthStoreError.EmailInvalidError
      if (self.loginPassword.length === 0) return AuthStoreError.PasswordMissingError

      return null
    },
    get displayName() {
      if (self.firebaseUser.displayName) {
        return self.firebaseUser.displayName
      } else if (self.user.firstName && self.user.lastName) {
        return `${self.user.firstName} ${self.user.lastName}`
      }

      console.warn("User display name not available. This should not be possible.")
      return self.firebaseUser.email
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    setFirebaseUser(firebaseUser: FirebaseAuthTypes.User) {
      if (!firebaseUser) throw new Error("AuthenticationStore.setFirebaseUser failed")
      self.firebaseUser = firebaseUser
    },
    setUser(user: User) {
      self.user = user
    },
    setLoginEmail(email: string) {
      self.loginEmail = email
    },
    setLoginPassword(password: string) {
      self.loginPassword = password
    },
    setPrivateAccount(isPrivate: boolean) {
      self.user.privateAccount = isPrivate
      getEnv<RootStoreDependencies>(self).userRepository.user = self.user
    },
    invalidateSession() {
      self.firebaseUser = undefined
      self.user = undefined
    },
    resetAuthError() {
      self.authError = undefined
    },
    catchAuthError(error) {
      console.error("AuthenticationStore ERROR: ", error)
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
    setUserWithFirebaseUser(firebaseUser: FirebaseAuthTypes.User) {
      self.setProp("isLoadingProfile", true)

      const uid = firebaseUser.uid
      getEnv(self)
        .userRepository.get(uid)
        .then((user) => {
          self.setUser(user)
          self.setFirebaseUser(firebaseUser)

          self.setProp("isLoadingProfile", false)
        })
        .catch(console.error)
    },
    setUserWithFirebaseUserCred(firebaseUserCred: FirebaseAuthTypes.UserCredential) {
      self.setProp("isLoadingProfile", true)

      const uid = firebaseUserCred.user.uid
      getEnv(self)
        .userRepository.get(uid)
        .then((user) => {
          self.setUser(user)
          self.setFirebaseUser(firebaseUserCred.user)

          self.setProp("isLoadingProfile", false)
        })
        .catch(console.error)
    },
  }))
  // Utility actions are defined first to be used in async actions below
  .actions((self) => ({
    logout() {
      auth().signOut()
      self.invalidateSession()
    },
    deleteAccount: flow(function* () {
      try {
        yield getEnv(self).userRepository.delete()
        yield auth().currentUser.delete() // Also signs user out
        self.invalidateSession()
      } catch (error) {
        self.catchAuthError(error)
      }
    }),
    signInWithEmail() {
      if (self.validationError) return

      self.setProp("isLoadingProfile", true)
      auth()
        .signInWithEmailAndPassword(self.loginEmail, self.loginPassword)
        .then((userCred) => {
          self.setUserWithFirebaseUserCred(userCred)

          self.setProp("isLoadingProfile", false)
        })
        .catch(self.catchAuthError)
    },
    signUpWithEmail() {
      if (self.validationError) return

      self.setProp("isLoadingProfile", true)
      auth()
        .createUserWithEmailAndPassword(self.user.email, self.loginPassword)
        .then((userCred) => {
          const user = createUserFromFirebaseUserCred(userCred)
          getEnv(self).userRepository.create(user).catch(console.error)
          self.setUser(user)
          self.setFirebaseUser(userCred.user)

          self.setProp("isLoadingProfile", false)
        })
        .catch(self.catchAuthError)
    },
    signInWithGoogle: flow(function* () {
      self.setProp("isLoadingProfile", true)

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
          .then((userCred) => {
            self.setFirebaseUser(userCred.user)
            const user = createUserFromFirebaseUserCred(userCred)

            if (userCred.additionalUserInfo.isNewUser) {
              getEnv(self).userRepository.create(user).catch(console.error)
            }
            self.setUser(user)

            self.setProp("isLoadingProfile", false)
          })
      } catch (error) {
        self.catchAuthError(error)
      }
      return null
    }),
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
