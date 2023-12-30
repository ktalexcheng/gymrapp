import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage"
import { api } from "app/services/api"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { getNestedField } from "app/utils/getNestedField"
import { UserErrorType } from "../constants"
import { FollowRequest, Gym, GymDetails, User, UserId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class UserRepository extends BaseRepository<User, UserId> {
  #userId: string
  #userFollowsCollectionName = "userFollows"
  #userFollowingCollectionName = "following"
  #userFollowersCollectionName = "followers"
  #followRequestsCollectionName = "requests"
  #userFollowsCollection: FirebaseFirestoreTypes.CollectionReference

  constructor(firebaseClient) {
    super("UserRepository", firebaseClient, "users", "userId")
    this.#userFollowsCollection = this.firestoreClient.collection(this.#userFollowsCollectionName)
  }

  /**
   * Retrieves the value of a property in the user document
   * Primarily for sharing user properties across different stores (other than UserStore)
   * @param propPath Dot-notation path to the property, e.g. "preferences.restTime"
   * @returns Value of the property, or undefined if the property does not exist
   */
  async getUserProp(propPath: string): Promise<any> {
    const user = await this.get(this.#userId, false)
    return getNestedField(user, propPath)
  }

  setUserId(userId: string): void {
    this.#userId = userId
  }

  checkRepositoryInitialized(): void {
    super.checkRepositoryInitialized()
    if (!this.#userId) {
      throw new RepositoryError(this.repositoryId, "Repository not initialized with userId")
    }
  }

  async update(id: UserId, data: Partial<User>, useSetMerge = false): Promise<User> {
    // Create a copy of data for manipulation
    const _data = { ...data }

    // If data contains userHandle or _userHandleLower, remove it from the update
    // and update the userHandle separately to ensure no duplicates
    if (_data.userHandle || _data._userHandleLower) {
      console.debug("UserRepository.update updating user handle")
      try {
        // Only server side code can perform a query in transaction, which we need to check for duplicates
        // So we rely on cloud functions to update user handle
        const status = await api.updateUserHandle(_data.userHandle)
        if (status === UserErrorType.UserHandleAlreadyTakenError) {
          return Promise.reject(new Error("User handle already exists", { cause: status }))
        }
        !!_data.userHandle && delete _data.userHandle
        !!_data._userHandleLower && delete _data._userHandleLower
      } catch (e) {
        throw new RepositoryError(this.repositoryId, `update error updating user handle: ${e}`)
      }
    }

    return await super.update(id ?? this.#userId, _data, useSetMerge)
  }

  async uploadAvatar(imagePath: string): Promise<string> {
    this.checkRepositoryInitialized()

    // If imagePath is already a hyperlink, download and reupload to storage
    let imageBlob: Blob
    if (imagePath.startsWith("http")) {
      try {
        const response = await fetch(imagePath)
        imageBlob = await response.blob()
      } catch (e) {
        throw new RepositoryError(this.repositoryId, `uploadAvatar error getting image: ${e}`)
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
          "UserRepository.uploadAvatar task update:",
          taskSnapshot.state,
          "; progress (bytes):",
          taskSnapshot.bytesTransferred,
          "/",
          taskSnapshot.totalBytes,
        )
      },
      (error) => {
        throw new RepositoryError(this.repositoryId, `uploadAvatar error on upload task: ${error}`)
      },
    )

    let imageUrl: string
    await uploadTask.then(async () => {
      console.debug("UserRepository.uploadAvatar upload done")
      imageUrl = await avatarRef.getDownloadURL()
    })

    return imageUrl
  }

  // async followUser(followeeUserId: UserId): Promise<void> {
  //   console.debug("UserRepository.followUser called")
  //   this.checkRepositoryInitialized()

  //   const userFollowingDocRef = this.#userFollowsCollection
  //     .doc(this.#userId)
  //     .collection(this.#userFollowingCollectionName)
  //     .doc(followeeUserId)
  //   const followeeFollowersDocRef = this.#userFollowsCollection
  //     .doc(followeeUserId)
  //     .collection(this.#userFollowersCollectionName)
  //     .doc(this.#userId)

  //   try {
  //     await userFollowingDocRef.set({ followDate: new Date() } as UserFollowing)
  //     await followeeFollowersDocRef.set({ followDate: new Date() } as UserFollowing)
  //   } catch (e) {
  //     throw new RepositoryError(this.repositoryId, `followUser error: ${e}`)
  //   }
  // }

  // async unfollowUser(followeeUserId: UserId): Promise<void> {
  //   console.debug("UserRepository.unfollowUser called")
  //   this.checkRepositoryInitialized()

  //   const userFollowingDocRef = this.#userFollowsCollection
  //     .doc(this.#userId)
  //     .collection(this.#userFollowingCollectionName)
  //     .doc(followeeUserId)
  //   const followeeFollowersDocRef = this.#userFollowsCollection
  //     .doc(followeeUserId)
  //     .collection(this.#userFollowersCollectionName)
  //     .doc(this.#userId)

  //   try {
  //     await userFollowingDocRef.delete()
  //     await followeeFollowersDocRef.delete()
  //   } catch (e) {
  //     throw new RepositoryError(this.repositoryId, `unfollowUser error: ${e}`)
  //   }
  // }

  // This check is done once when the user enters a new user handle
  // and it is done again in a transaction when the user submits the new user handle
  async userHandleIsAvailable(userHandle: string): Promise<boolean> {
    console.debug("UserRepository.userHandleAvailable called")

    const userHandleDocRef = this.firestoreClient
      .collection("users")
      .where("_userHandleLower", "==", userHandle.toLowerCase())
      .limit(1)

    try {
      const userHandleDoc = await userHandleDocRef.get()
      console.debug("UserRepository.userHandleAvailable userHandleDoc.empty", userHandleDoc.empty)
      return userHandleDoc.empty
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `userHandleAvailable error: ${e}`)
    }
  }

  async isFollowingUser(followeeUserId: UserId): Promise<boolean> {
    console.debug("UserRepository.isFollowingUser called")
    this.checkRepositoryInitialized()

    console.debug("UserRepository.isFollowingUse:", { userId: this.#userId, followeeUserId })
    const userFollowingDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingCollectionName)
      .doc(followeeUserId)

    try {
      const userFollowingDoc = await userFollowingDocRef.get()
      console.debug(
        "UserRepository.isFollowingUser userFollowingDoc.exists",
        userFollowingDoc.exists,
      )
      return userFollowingDoc.exists
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `isFollowingUser error: ${e}`)
    }
  }

  async isFollowRequested(followeeUserId: UserId): Promise<boolean> {
    console.debug("UserRepository.isFollowRequested called")
    this.checkRepositoryInitialized()

    const followRequestDocRef = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#followRequestsCollectionName)
      .where("requestedByUserId", "==", this.#userId)
      .where("isAccepted", "==", false)
      .where("isDeclined", "==", false)
      .limit(1)

    try {
      const followRequestDoc = await followRequestDocRef.get()
      console.debug(
        "UserRepository.isFollowRequested followRequestDoc.empty",
        followRequestDoc.empty,
      )
      return !followRequestDoc.empty
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `isFollowRequested error: ${e}`)
    }
  }

  async cancelFollowRequest(followeeUserId: UserId): Promise<void> {
    console.debug("UserRepository.cancelFollowRequest called")
    this.checkRepositoryInitialized()

    const followRequestDocQuery = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#followRequestsCollectionName)
      .where("requestedByUserId", "==", this.#userId)

    try {
      const followRequestDoc = await followRequestDocQuery.get()
      for (const doc of followRequestDoc.docs) {
        console.debug("UserRepository.cancelFollowRequest deleting doc:", doc.id)
        await doc.ref.delete()
      }
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `cancelFollowRequest error: ${e}`)
    }
  }

  async getFollowRequests(): Promise<FollowRequest[]> {
    console.debug("UserRepository.getFollowRequests called")
    this.checkRepositoryInitialized()

    const followRequestsCollection = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#followRequestsCollectionName)

    try {
      const followRequestsDoc = await followRequestsCollection.get()
      const followRequests: FollowRequest[] = []
      for (const doc of followRequestsDoc.docs) {
        followRequests.push(convertFirestoreTimestampToDate(doc.data()) as FollowRequest)
      }
      console.debug("UserRepository.getFollowRequests:", followRequestsCollection.path)
      console.debug("UserRepository.getFollowRequests followRequests:", followRequests)
      return followRequests
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `getFollowRequests error: ${e}`)
    }
  }

  async declineFollowRequest(requestId: string): Promise<void> {
    console.debug("UserRepository.declineFollowRequest called")
    this.checkRepositoryInitialized()

    const followRequestsCollection = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#followRequestsCollectionName)

    try {
      await followRequestsCollection.doc(requestId).update({ isAccepted: false, isDeclined: true })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `declineFollowRequest error: ${e}`)
    }
  }

  async acceptFollowRequest(requestId: string): Promise<void> {
    console.debug("UserRepository.acceptFollowRequest called")
    this.checkRepositoryInitialized()

    const followRequestsCollection = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#followRequestsCollectionName)

    try {
      await followRequestsCollection.doc(requestId).update({ isAccepted: true, isDeclined: false })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `acceptFollowRequest error: ${e}`)
    }
  }

  // async getUserLocation() {
  //   console.debug("UserRepository.getUserLocation called")
  //   const { status } = await Location.requestForegroundPermissionsAsync()
  //   if (status !== Location.PermissionStatus.GRANTED) {
  //     console.debug("UserRepository.getUserLocation status !== granted")
  //     return undefined
  //   }

  //   const location = await Location.getCurrentPositionAsync({})
  //   return location
  // }

  async addToMyGyms(gym: GymDetails) {
    const userUpdate = {
      myGyms: firestore.FieldValue.arrayUnion({ gymId: gym.gymId, gymName: gym.gymName }),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.update(this.firestoreCollection.doc(this.#userId), userUpdate)

        const gymMembersCollection = this.firestoreClient
          .collection("gyms")
          .doc(gym.gymId)
          .collection("gymMembers")
        tx.set(gymMembersCollection.doc(this.#userId), {
          userId: this.#userId,
          dateAdded: firestore.FieldValue.serverTimestamp(),
        })
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `addToMyGyms error: ${e}`)
    }

    // Do not include the final read operation in the transaction
    // See: https://firebase.google.com/docs/firestore/manage-data/transactions#transactions
    const updatedUser = await this.get(this.#userId, true)
    console.debug("addToMyGyms updatedUser:", updatedUser)
    console.debug("addToMyGyms new cached data:", this.getCacheData(this.#userId))
    return updatedUser
  }

  async removeFromMyGyms(gym: Gym | GymDetails) {
    const userUpdate = {
      myGyms: firestore.FieldValue.arrayRemove({ gymId: gym.gymId, gymName: gym.gymName }),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.update(this.firestoreCollection.doc(this.#userId), userUpdate)

        const gymMembersCollection = this.firestoreClient
          .collection("gyms")
          .doc(gym.gymId)
          .collection("gymMembers")
        tx.delete(gymMembersCollection.doc(this.#userId))
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `removeFromMyGyms error: ${e}`)
    }

    // Do not include the final read operation in the transaction
    // See: https://firebase.google.com/docs/firestore/manage-data/transactions#transactions
    const updatedUser = await this.get(this.#userId, true)
    console.debug("removeFromMyGyms updatedUser:", updatedUser)
    console.debug("removeFromMyGyms new cached data:", this.getCacheData(this.#userId))
    return updatedUser
  }
}
