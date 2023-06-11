import { flow, getEnv, types } from "mobx-state-tree"
import { User, isUser } from "../data/model"
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

export const UserStoreModel = types
  .model("UserStoreModel")
  .props({
    user: UserType,
    isLoading: true,
  })
  .views((self) => ({
    get displayName() {
      if (self.user.firstName && self.user.lastName) {
        return `${self.user.firstName} ${self.user.lastName}`
      }

      console.warn("User display name not available. This should not be possible.")
      return self.user.email
    },
    get isPrivate() {
      return !!self.user.privateAccount
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getProfile: flow(function* (userId: string) {
      self.isLoading = true
      const user = yield getEnv<RootStoreDependencies>(self).userRepository.get(userId)
      self.user = user
      self.isLoading = false
    }),
    setPrivateAccount(isPrivate: boolean) {
      self.user.privateAccount = isPrivate
      getEnv<RootStoreDependencies>(self).userRepository.user = self.user
    },
  }))
