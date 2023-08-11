import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import { ExerciseSettings, User } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class UserRepository implements BaseRepository<User> {
  #userId: string
  #user: User
  _collectionName = "users"
  _firestoreClient: FirebaseFirestoreTypes.Module

  constructor(firebaseClient) {
    this._firestoreClient = firebaseClient
  }

  _getCurrentUser(): FirebaseFirestoreTypes.DocumentReference {
    // if (!auth().currentUser) throw new RepositoryError("No user signed in")

    if (!this.#userId) {
      throw new RepositoryError("(_getCurrentUser) no user set")
    }

    return this._firestoreClient.collection(this._collectionName).doc(this.#userId)
  }

  async _getUserSnapshot(): Promise<FirebaseFirestoreTypes.DocumentSnapshot> {
    const userRef = this._getCurrentUser()
    const userSnapshot = await userRef.get()
    return userSnapshot
  }

  get userId(): string {
    return this.#userId
  }

  get user(): User {
    return this.#user
  }

  get userExerciseSettings(): {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[] {
    if (!this.#user) {
      console.error("UserRepository.get userExerciseSettings error: No user set")
      return undefined
    }

    return this.#user.preferences?.allExerciseSettings
  }

  async uploadAvatar(imagePath: string): Promise<string> {
    const avatarRef = storage().ref(`${this.#userId}/profile/avatar`)
    const uploadTask = avatarRef.putFile(imagePath)

    await uploadTask.on(
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
      () => {
        console.debug("UserRepository.uploadAvatar upload done")
      },
    )

    return await avatarRef.getDownloadURL()
  }

  // updateUserExerciseSettings(
  //   allExerciseSettings: {
  //     exerciseId: string
  //     exerciseSettings: ExerciseSettings
  //   }[],
  // ) {
  //   if (!this.#user) {
  //     console.error("UserRepository.set userExerciseSettings error: No user set")
  //     return
  //   }

  //   this.#user.preferences.allExerciseSettings = allExerciseSettings
  //   this.update()
  // }

  get userWorkoutMetas() {
    if (!this.#user) {
      console.error("UserRepository.get userWorkouts error: No user set")
      return undefined
    }

    return this.#user.workoutMetas
  }

  // saveNewWorkoutMeta(workoutsMeta: Record<string, WorkoutMeta>) {
  //   if (!this.#user) {
  //     console.error("UserRepository.set userWorkouts error: No user set")
  //     return
  //   }

  //   if (this.#user.workoutsMeta === undefined) {
  //     this.#user.workoutsMeta = {}
  //   }

  //   Object.keys(workoutsMeta).forEach((k) => {
  //     this.#user.workoutsMeta[k] = workoutsMeta[k]
  //   })
  //   this.update()
  // }

  logout(): void {
    this.#userId = undefined
    this.#user = undefined
  }

  async get(userId = this.#userId): Promise<User> {
    this.#userId = userId

    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) return null

    const data = snapshot.data() as User
    console.debug("UserRepository.get data:", data)
    this.#user = {
      userId,
      ...data,
      // privateAccount: data.privateAccount,
      // firstName: data.firstName,
      // lastName: data.lastName,
      // preferences: data.preferences,
      // providerId: data.providerId,
      // email: data.email,
      // avatarUrl: data.avatarUrl,
      // workoutsMeta: data.workoutsMeta,
      // exerciseRecords: data.exerciseRecords
    }

    return this.#user
  }

  async create(user: User): Promise<void> {
    // Firebase rule set up to only allow create for new users
    // Only the user itself can read, update, or delete
    this._firestoreClient.collection(this._collectionName).doc(user.userId).set(user)

    this.#userId = user.userId
    this.#user = user
  }

  async updateById() {
    throw Error("method not implemented")
  }

  async update(partialUser: Partial<User>, useSetMerge = false): Promise<void> {
    if (Object.keys(partialUser).length === 0)
      throw new RepositoryError("(update) partialUser is empty")

    if (!this.#userId) throw new RepositoryError("(update) userId is invalid")

    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(update) User does not exist")

    try {
      // Important note: using the .catch() callback resulted in unhandled promises for some reason
      console.debug("UserRepository.update user:", partialUser)
      const userDocRef = await this._firestoreClient
        .collection(this._collectionName)
        .doc(this.#userId)
      if (useSetMerge) {
        await userDocRef.set(partialUser, { merge: true })
      } else {
        await userDocRef.update(partialUser)
      }
      // .catch((e) => console.error("UserRepository.update error:", e))
    } catch (e) {
      console.error("UserRepository.update error:", e)
    }

    this.#user = { ...this.#user, ...partialUser }
  }

  async delete(userId = this.#userId): Promise<void> {
    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(delete) User does not exist")

    await this._firestoreClient.collection(this._collectionName).doc(userId).delete()

    this.logout()
  }
}
