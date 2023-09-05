import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage"
import { DefaultUserPreferences } from "../constants"
import { User, UserFollowing, UserId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class PrivateUserRepository extends BaseRepository<User, UserId> {
  #userId: string
  #userFollowsCollectionName = "userFollows"
  #userFollowingsCollectionName = "followings"
  #userFollowersCollectionName = "followers"
  #userFollowsCollection: FirebaseFirestoreTypes.CollectionReference

  constructor(firebaseClient) {
    super("PrivateUserRepository", firebaseClient, "usersPrivate", "userId")
    this.#userFollowsCollection = this.firestoreClient.collection(this.#userFollowsCollectionName)
  }

  getUserPropFromCacheData(propPath: string): any {
    const cacheData = this.getCacheData(this.#userId)
    if (!cacheData) return null

    const keys = propPath.split(".")
    let prop = cacheData.data as unknown
    for (const key of keys) {
      if (prop === null || prop === undefined) {
        console.warn(
          `PrivateUserRepository.getUserPropFromCacheData warning: Invalid propPath or cache data: ${propPath}`,
        )
        return undefined
      }

      if (prop instanceof Map) {
        if (prop.has(key)) {
          prop = prop.get(key)
        } else {
          // console.warn(
          //   `PrivateUserRepository.getUserPropFromCacheData warning: Invalid key ${key} in propPath: ${propPath}`,
          // )
          return undefined
        }
      } else if (prop instanceof Object) {
        if (key in prop) {
          prop = prop[key]
        } else {
          // console.warn(
          //   `PrivateUserRepository.getUserPropFromCacheData warning: Invalid key ${key} in propPath: ${propPath}`,
          // )
          return undefined
        }
      }
    }

    return prop
  }

  getUserPreference(pref: keyof typeof DefaultUserPreferences) {
    const prefPath = `preferences.${pref}`
    const prefValue = this.getUserPropFromCacheData(prefPath)
    if (prefValue === undefined) {
      return DefaultUserPreferences[pref]
    }

    return prefValue
  }

  setUserId(userId: string): void {
    this.#userId = userId
  }

  async update(id: UserId, data: Partial<User>, useSetMerge = false): Promise<void> {
    await super.update(id ?? this.#userId, data, useSetMerge)
  }

  async uploadAvatar(imagePath: string): Promise<string> {
    // If imagePath is already a hyperlink, download and reupload to storage
    let imageBlob: Blob
    if (imagePath.startsWith("http")) {
      try {
        const response = await fetch(imagePath)
        imageBlob = await response.blob()
      } catch (e) {
        console.error("PrivateUserRepository.uploadAvatar error getting image:", e)
      }
    }

    const avatarRef = storage().ref(`${this.#userId}/profile/avatar`)
    let uploadTask: FirebaseStorageTypes.Task
    if (imageBlob) {
      uploadTask = avatarRef.put(imageBlob)
    } else {
      uploadTask = avatarRef.putFile(imagePath)
    }

    uploadTask.on(
      "state_changed",
      (taskSnapshot) => {
        console.debug(
          "PrivateUserRepository.uploadAvatar task update:",
          taskSnapshot.state,
          "; progress (bytes):",
          taskSnapshot.bytesTransferred,
          "/",
          taskSnapshot.totalBytes,
        )
      },
      (error) => {
        console.error("PrivateUserRepository.uploadAvatar error:", error)
      },
    )

    let imageUrl: string
    await uploadTask.then(async () => {
      console.debug("PrivateUserRepository.uploadAvatar upload done")
      imageUrl = await avatarRef.getDownloadURL()
    })

    return imageUrl
  }

  async followUser(followeeUserId: UserId): Promise<void> {
    const userFollowingsDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingsCollectionName)
      .doc(followeeUserId)
    const followeeFollowersDocRef = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#userFollowersCollectionName)
      .doc(this.#userId)

    try {
      await userFollowingsDocRef.set({ followDate: new Date() } as UserFollowing)
      await followeeFollowersDocRef.set({ followDate: new Date() } as UserFollowing)
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `followUser error: ${e}`)
    }
  }

  async unfollowUser(followeeUserId: UserId): Promise<void> {
    const userFollowingsDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingsCollectionName)
      .doc(followeeUserId)
    const followeeFollowersDocRef = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#userFollowersCollectionName)
      .doc(this.#userId)

    try {
      await userFollowingsDocRef.delete()
      await followeeFollowersDocRef.delete()
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `unfollowUser error: ${e}`)
    }
  }
}
