import storage from "@react-native-firebase/storage"
import { User, UserId } from "../model"
import { BaseRepository } from "./baseRepository"

// export class UserRepository implements BaseRepository<User> {
//   #userId: string
//   #user: User
//   _collectionName = "users"
//   _firestoreClient: FirebaseFirestoreTypes.Module

//   constructor(firebaseClient) {
//     this._firestoreClient = firebaseClient
//   }

//   _getCurrentUser(): FirebaseFirestoreTypes.DocumentReference {
//     // if (!auth().currentUser) throw new RepositoryError("No user signed in")

//     if (!this.#userId) {
//       throw new RepositoryError("(_getCurrentUser) no user set")
//     }

//     return this._firestoreClient.collection(this._collectionName).doc(this.#userId)
//   }

//   async _getUserSnapshot(): Promise<FirebaseFirestoreTypes.DocumentSnapshot> {
//     const userRef = this._getCurrentUser()
//     const userSnapshot = await userRef.get()
//     return userSnapshot
//   }

//   get userId(): string {
//     return this.#userId
//   }

//   get user(): User {
//     return this.#user
//   }

//   get userExerciseSettings(): {
//     exerciseId: string
//     exerciseSettings: ExerciseSettings
//   }[] {
//     if (!this.#user) {
//       console.error("UserRepository.get userExerciseSettings error: No user set")
//       return undefined
//     }

//     return this.#user.preferences?.allExerciseSettings
//   }

//   async uploadAvatar(imagePath: string): Promise<string> {
//     const avatarRef = storage().ref(`${this.#userId}/profile/avatar`)
//     const uploadTask = avatarRef.putFile(imagePath)

//     uploadTask.on(
//       "state_changed",
//       (taskSnapshot) => {
//         console.debug(
//           "UserRepository.uploadAvatar task update:",
//           taskSnapshot.state,
//           "; progress (bytes):",
//           taskSnapshot.bytesTransferred,
//           "/",
//           taskSnapshot.totalBytes,
//         )
//       },
//       (error) => {
//         console.error("UserRepository.uploadAvatar error:", error)
//       },
//     )

//     let imageUrl: string
//     await uploadTask.then(async () => {
//       console.debug("UserRepository.uploadAvatar upload done")
//       imageUrl = await avatarRef.getDownloadURL()
//     })

//     return imageUrl
//   }

//   get userWorkoutMetas() {
//     if (!this.#user) {
//       console.error("UserRepository.get userWorkouts error: No user set")
//       return undefined
//     }

//     return this.#user.workoutMetas
//   }

//   logout(): void {
//     this.#userId = undefined
//     this.#user = undefined
//   }

//   async get(userId = this.#userId): Promise<User> {
//     this.#userId = userId

//     const snapshot = await this._getUserSnapshot()
//     if (!snapshot.exists) return null

//     const data = snapshot.data() as User
//     console.debug("UserRepository.get data:", data)
//     this.#user = {
//       userId,
//       ...data,
//     }

//     return this.#user
//   }

//   async create(user: User): Promise<void> {
//     // Firebase rule set up to only allow create for new users
//     // Only the user itself can read, update, or delete
//     this._firestoreClient.collection(this._collectionName).doc(user.userId).set(user)

//     this.#userId = user.userId
//     this.#user = user
//   }

//   async updateById() {
//     throw Error("method not implemented")
//   }

//   async update(partialUser: Partial<User>, useSetMerge = false): Promise<void> {
//     if (Object.keys(partialUser).length === 0)
//       throw new RepositoryError("(update) partialUser is empty")

//     if (!this.#userId) throw new RepositoryError("(update) userId is invalid")

//     const snapshot = await this._getUserSnapshot()
//     if (!snapshot.exists) throw new RepositoryError("(update) User does not exist")

//     try {
//       // Important note: using the .catch() callback resulted in unhandled promises for some reason
//       console.debug("UserRepository.update user:", partialUser)
//       const userDocRef = await this._firestoreClient
//         .collection(this._collectionName)
//         .doc(this.#userId)
//       if (useSetMerge) {
//         await userDocRef.set(partialUser, { merge: true })
//       } else {
//         await userDocRef.update(partialUser)
//       }
//       // .catch((e) => console.error("UserRepository.update error:", e))
//     } catch (e) {
//       console.error("UserRepository.update error:", e)
//     }

//     this.#user = { ...this.#user, ...partialUser }
//   }

//   async delete(userId = this.#userId): Promise<void> {
//     const snapshot = await this._getUserSnapshot()
//     if (!snapshot.exists) throw new RepositoryError("(delete) User does not exist")

//     await this._firestoreClient.collection(this._collectionName).doc(userId).delete()

//     this.logout()
//   }
// }

export class UserRepository extends BaseRepository<User, UserId> {
  constructor(firebaseClient) {
    super("UserRepository", firebaseClient, "users", "userId")
  }

  #userId: string
  #cacheKey: string

  getUserPropFromCacheData(propPath: string): any {
    const cacheData = this.getCacheData(this.#cacheKey)
    if (!cacheData) return null

    const keys = propPath.split(".")
    let prop = cacheData.data as User
    for (const key in keys) {
      if (prop === null || typeof prop !== "object") {
        return undefined
      }
      prop = prop[key]
    }

    return prop
  }

  async get(id: string, refresh = false): Promise<User> {
    const user = super.get(id, refresh)
    this.#userId = id
    this.#cacheKey = await this.createCacheKeyFromString(id)

    return user
  }

  async update(id: UserId, data: Partial<User>, useSetMerge = false): Promise<void> {
    super.update(id ?? this.#userId, data, useSetMerge)
  }

  async uploadAvatar(imagePath: string): Promise<string> {
    const avatarRef = storage().ref(`${this.#userId}/profile/avatar`)
    const uploadTask = avatarRef.putFile(imagePath)

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
        console.error("UserRepository.uploadAvatar error:", error)
      },
    )

    let imageUrl: string
    await uploadTask.then(async () => {
      console.debug("UserRepository.uploadAvatar upload done")
      imageUrl = await avatarRef.getDownloadURL()
    })

    return imageUrl
  }
}
