import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage"
import { api } from "app/services/api"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { UserErrorType } from "../constants"
import {
  FollowRequest,
  Gym,
  GymDetails,
  User,
  UserFollowers,
  UserFollowing,
  UserId,
} from "../types"
import { BaseRepository, FirebaseSnapshotType, RepositoryError } from "./baseRepository"

export class UserRepository extends BaseRepository<User, UserId> {
  #userId?: string
  #userFollowsCollectionName = "userFollows"
  #userFollowingCollectionName = "following"
  #userFollowersCollectionName = "followers"
  #followRequestsCollectionName = "requests"
  #userFollowsCollection: FirebaseFirestoreTypes.CollectionReference

  constructor(firebaseClient) {
    super("UserRepository", firebaseClient, "users", "userId")
    this.#userFollowsCollection = this.firestoreClient.collection(this.#userFollowsCollectionName)
  }

  setUserId(userId?: string): void {
    this.#userId = userId
  }

  checkRepositoryInitialized(): void {
    super.checkRepositoryInitialized()
    if (!this.#userId) {
      throw new RepositoryError(this.repositoryId, "Repository not initialized with userId")
    }
  }

  async get(id: UserId | null, refresh = true): Promise<User | undefined> {
    return await super.get(id ?? this.#userId!, refresh)
  }

  async update(
    id: UserId | null,
    data: Partial<User>,
    useSetMerge = false,
    isOffline = false,
  ): Promise<User> {
    this.checkRepositoryInitialized()

    // Create a copy of data for manipulation
    const _data = { ...data }

    // If data contains userHandle or _userHandleLower, remove it from the update
    // and update the userHandle separately to ensure no duplicates
    if (_data.userHandle) {
      console.debug("UserRepository.update updating user handle")
      try {
        // Only server side code can perform a query in transaction, which we need to check for duplicates
        // So we rely on cloud functions to update user handle
        const status = await api.updateUserHandle(_data.userHandle)
        if (status === UserErrorType.UserHandleAlreadyTakenError) {
          throw new Error("User handle already exists", { cause: status })
        }
        !!_data.userHandle && delete _data.userHandle
        !!_data._userHandleLower && delete _data._userHandleLower
      } catch (e) {
        throw new RepositoryError(this.repositoryId, `update error updating user handle: ${e}`)
      }
    }

    console.debug("UserRepository.update:", { id, _data, useSetMerge, isOffline })
    return await super.update(id ?? this.#userId!, _data, useSetMerge, isOffline)
  }

  async uploadAvatar(imagePath: string): Promise<string> {
    this.checkRepositoryInitialized()

    // If imagePath is already a hyperlink, download and reupload to storage
    let imageBlob: Blob | undefined
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

    const imageUrl = await uploadTask.then(async () => {
      console.debug("UserRepository.uploadAvatar upload done")
      return await avatarRef.getDownloadURL()
    })

    return imageUrl
  }

  // This check is done once when the user enters a new user handle (to inform availability)
  // and it is done again in a transaction when the user submits the new user handle (to avoid duplicate)
  async userHandleIsAvailable(userHandle: string): Promise<boolean> {
    console.debug("UserRepository.userHandleIsAvailable called")

    const userHandleDocRef = this.firestoreClient
      .collection("users")
      .where("_userHandleLower", "==", userHandle.toLowerCase())
      .limit(1)

    try {
      const userHandleDoc = await userHandleDocRef.get()
      console.debug("UserRepository.userHandleIsAvailable userHandleDoc.empty", userHandleDoc.empty)
      return userHandleDoc.empty
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `userHandleIsAvailable error: ${e}`)
    }
  }

  async isFollowingUser(followeeUserId: UserId): Promise<boolean> {
    this.checkRepositoryInitialized()

    // console.debug("UserRepository.isFollowingUser:", { userId: this.#userId, followeeUserId })
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

  async removeFollower(followerUserId: UserId): Promise<void> {
    console.debug("UserRepository.removeFollower called")
    this.checkRepositoryInitialized()

    const userFollowersCollection = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowersCollectionName)

    try {
      await userFollowersCollection.doc(followerUserId).delete()
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `removeFollower error: ${e}`)
    }
  }

  async addFollower(followerUserId: UserId): Promise<void> {
    console.debug("UserRepository.addFollower called")
    this.checkRepositoryInitialized()

    const userFollowersCollection = this.#userFollowsCollection
      .doc(this.#userId)
      .collection(this.#userFollowersCollectionName)

    try {
      await userFollowersCollection.doc(followerUserId).set({
        followDate: firestore.FieldValue.serverTimestamp(),
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `addFollower error: ${e}`)
    }
  }

  async addToMyGyms(gym: GymDetails) {
    this.checkRepositoryInitialized()

    const userUpdate = {
      myGyms: firestore.FieldValue.arrayUnion({ gymId: gym.gymId, gymName: gym.gymName }),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.update(this.firestoreCollection!.doc(this.#userId), userUpdate)

        // const gymMembersCollection = this.firestoreClient
        //   .collection("gyms")
        //   .doc(gym.gymId)
        //   .collection("gymMembers")
        // tx.set(gymMembersCollection.doc(this.#userId), {
        //   userId: this.#userId,
        //   dateAdded: firestore.FieldValue.serverTimestamp(),
        // })
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `addToMyGyms error: ${e}`)
    }

    // Do not include the final read operation in the transaction
    // See: https://firebase.google.com/docs/firestore/manage-data/transactions#transactions
    const updatedUser = await this.get(this.#userId!, true)
    console.debug("addToMyGyms updatedUser:", updatedUser)
    console.debug("addToMyGyms new cached data:", this.getCacheData(this.#userId!))
    return updatedUser
  }

  async removeFromMyGyms(gym: Gym | GymDetails) {
    this.checkRepositoryInitialized()

    const userUpdate = {
      myGyms: firestore.FieldValue.arrayRemove({ gymId: gym.gymId, gymName: gym.gymName }),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.update(this.firestoreCollection!.doc(this.#userId), userUpdate)

        // const gymMembersCollection = this.firestoreClient
        //   .collection("gyms")
        //   .doc(gym.gymId)
        //   .collection("gymMembers")
        // tx.delete(gymMembersCollection.doc(this.#userId))
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `removeFromMyGyms error: ${e}`)
    }

    // Do not include the final read operation in the transaction
    // See: https://firebase.google.com/docs/firestore/manage-data/transactions#transactions
    const updatedUser = await this.get(this.#userId!, true)
    console.debug("removeFromMyGyms updatedUser:", updatedUser)
    console.debug("removeFromMyGyms new cached data:", this.getCacheData(this.#userId!))
    return updatedUser
  }

  async getAllBlockedUsers(): Promise<UserId[]> {
    this.checkRepositoryInitialized()

    try {
      const userFollowsDoc = await this.#userFollowsCollection.doc(this.#userId).get()
      const blockedUserIds = userFollowsDoc.data()?.blockedUserIds ?? []
      console.debug("UserRepository.getAllBlockedUsers blockedUserIds", blockedUserIds)
      return blockedUserIds
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `getAllBlockedUsers error: ${e}`)
    }
  }

  async blockUser(userIdToBlock: UserId): Promise<void> {
    this.checkRepositoryInitialized()

    const blockedUserIdsUpdate = {
      blockedUserIds: firestore.FieldValue.arrayUnion(userIdToBlock),
    }

    const blockedByUserIdsUpdate = {
      blockedByUserIds: firestore.FieldValue.arrayUnion(this.#userId),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.set(this.#userFollowsCollection.doc(this.#userId), blockedUserIdsUpdate, {
          mergeFields: ["blockedUserIds"],
        })
        tx.set(
          this.#userFollowsCollection.doc(userIdToBlock).collection("blockedBy").doc("blockedBy"),
          blockedByUserIdsUpdate,
          { mergeFields: ["blockedByUserIds"] },
        )
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `blockUser error: ${e}`)
    }
  }

  async unblockUser(userIdToUnblock: UserId): Promise<void> {
    this.checkRepositoryInitialized()

    const blockedUserIdsUpdate = {
      blockedUserIds: firestore.FieldValue.arrayRemove(userIdToUnblock),
    }

    const blockedByUserIdsUpdate = {
      blockedByUserIds: firestore.FieldValue.arrayRemove(this.#userId),
    }

    try {
      await this.firestoreClient.runTransaction(async (tx) => {
        tx.set(this.#userFollowsCollection.doc(this.#userId), blockedUserIdsUpdate, {
          mergeFields: ["blockedUserIds"],
        })
        tx.set(
          this.#userFollowsCollection.doc(userIdToUnblock).collection("blockedBy").doc("blockedBy"),
          blockedByUserIdsUpdate,
          { mergeFields: ["blockedByUserIds"] },
        )
      })
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `unblockUser error: ${e}`)
    }
  }

  async reportUser(userId: string, reasons: string[], otherReason?: string): Promise<void> {
    const violationsUsersColl = this.firestoreClient.collection(`violations/users/reports`)
    const reportData: any = {
      reportedAt: new Date(),
      userId,
      reasons,
    }
    if (otherReason) reportData.otherReason = otherReason

    try {
      await violationsUsersColl.add(reportData)
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `reportComment error: ${e}`)
    }
  }

  async getAllUserFollowers(
    userId: UserId,
    lastDocSnapshot?: FirebaseSnapshotType,
  ): Promise<{
    ids: UserId[]
    docData: UserFollowing[]
    hasMore: boolean
    lastDocSnapshot?: FirebaseSnapshotType
  }> {
    return await this.getByFilter<UserFollowers>(
      {
        limit: 50,
        orderBy: [{ field: "followDate", direction: "desc" }],
        afterSnapshot: lastDocSnapshot,
      },
      this.#userFollowsCollection.doc(userId).collection(this.#userFollowersCollectionName),
    )
  }

  async getAllUserFollowing(
    userId: UserId,
    lastDocSnapshot?: FirebaseSnapshotType,
  ): Promise<{
    ids: UserId[]
    docData: UserFollowing[]
    hasMore: boolean
    lastDocSnapshot?: FirebaseSnapshotType
  }> {
    return await this.getByFilter<UserFollowing>(
      {
        limit: 50,
        orderBy: [{ field: "followDate", direction: "desc" }],
        afterSnapshot: lastDocSnapshot,
      },
      this.#userFollowsCollection.doc(userId).collection(this.#userFollowingCollectionName),
    )
  }
}
