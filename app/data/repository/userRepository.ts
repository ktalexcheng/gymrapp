import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage"
import { getNestedField } from "app/utils/getNestedField"
import * as Location from "expo-location"
import { Gym, GymDetails, User, UserFollowing, UserId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class UserRepository extends BaseRepository<User, UserId> {
  #userId: string
  #userFollowsCollectionName = "userFollows"
  #userFollowingCollectionName = "following"
  #userFollowersCollectionName = "followers"
  #userFollowsCollection: FirebaseFirestoreTypes.CollectionReference

  constructor(firebaseClient?) {
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
    return await super.update(id ?? this.#userId, data, useSetMerge)
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

  async followUser(followeeUserId: UserId): Promise<void> {
    console.debug("UserRepository.followUser called")
    this.checkRepositoryInitialized()

    const userFollowingDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingCollectionName)
      .doc(followeeUserId)
    const followeeFollowersDocRef = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#userFollowersCollectionName)
      .doc(this.#userId)

    try {
      await userFollowingDocRef.set({ followDate: new Date() } as UserFollowing)
      await followeeFollowersDocRef.set({ followDate: new Date() } as UserFollowing)
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `followUser error: ${e}`)
    }
  }

  async unfollowUser(followeeUserId: UserId): Promise<void> {
    console.debug("UserRepository.unfollowUser called")
    this.checkRepositoryInitialized()

    const userFollowingDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingCollectionName)
      .doc(followeeUserId)
    const followeeFollowersDocRef = this.#userFollowsCollection
      .doc(followeeUserId)
      .collection(this.#userFollowersCollectionName)
      .doc(this.#userId)

    try {
      await userFollowingDocRef.delete()
      await followeeFollowersDocRef.delete()
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `unfollowUser error: ${e}`)
    }
  }

  async isFollowingUser(followeeUserId: UserId): Promise<boolean> {
    console.debug("UserRepository.isFollowingUser called")
    this.checkRepositoryInitialized()

    const userFollowingDocRef = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowingCollectionName)
      .doc(followeeUserId)

    const userFollowingDoc = await userFollowingDocRef.get()
    console.debug("UserRepository.isFollowingUser.exists", userFollowingDoc.exists)
    return userFollowingDoc.exists
  }

  async getUserLocation() {
    console.debug("UserRepository.getUserLocation called")
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== Location.PermissionStatus.GRANTED) {
      console.debug("UserRepository.getUserLocation status !== granted")
      return undefined
    }

    const location = await Location.getCurrentPositionAsync({})
    return location
  }

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
