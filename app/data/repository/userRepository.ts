import auth from "@react-native-firebase/auth"
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import { ExerciseSettings, User, WorkoutMeta } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class UserRepository implements BaseRepository<User> {
  #userId: string
  #user: User
  #collectionName = "users"

  _getCurrentUser(): FirebaseFirestoreTypes.DocumentReference {
    if (!auth().currentUser) throw new RepositoryError("No user signed in")
    return firestore().collection(this.#collectionName).doc(this.#userId)
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

  updateUserExerciseSettings(
    allExerciseSettings: {
      exerciseId: string
      exerciseSettings: ExerciseSettings
    }[],
  ) {
    if (!this.#user) {
      console.error("UserRepository.set userExerciseSettings error: No user set")
      return
    }

    this.#user.preferences.allExerciseSettings = allExerciseSettings
    this.update()
  }

  get userWorkoutsMeta(): Record<string, WorkoutMeta> {
    if (!this.#user) {
      console.error("UserRepository.get userWorkouts error: No user set")
      return undefined
    }

    return this.#user.workoutsMeta
  }

  saveNewWorkoutMeta(workoutsMeta: Record<string, WorkoutMeta>) {
    if (!this.#user) {
      console.error("UserRepository.set userWorkouts error: No user set")
      return
    }

    if (this.#user.workoutsMeta === undefined) {
      this.#user.workoutsMeta = {}
    }

    Object.keys(workoutsMeta).forEach((k) => {
      this.#user.workoutsMeta[k] = workoutsMeta[k]
    })
    this.update()
  }

  logout(): void {
    this.#userId = undefined
    this.#user = undefined
  }

  async get(userId = this.#userId): Promise<User> {
    this.#userId = userId

    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) return null

    const data = snapshot.data()
    this.#user = {
      userId,
      privateAccount: data.privateAccount,
      firstName: data.firstName,
      lastName: data.lastName,
      preferences: data.preferences,
      providerId: data.providerId,
      email: data.email,
      avatarUrl: data.avatarUrl,
      workoutsMeta: data.workoutsMeta,
    }

    return this.#user
  }

  async create(user: User): Promise<void> {
    // Firebase rule set up to only allow create for new users
    // Only the user itself can read, update, or delete
    firestore().collection(this.#collectionName).doc(user.userId).set(user)

    this.#userId = user.userId
    this.#user = user
  }

  async update(userId = this.#userId, user: Partial<User> = this.#user): Promise<void> {
    if (userId !== this.#userId) throw new RepositoryError("(update) userId is invalid")

    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(update) User does not exist")

    await firestore()
      .collection(this.#collectionName)
      .doc(userId)
      .update(user)
      .catch((e) => console.error("UserRepository.update error:", e))

    this.#user = { ...this.#user, ...user }
  }

  async delete(userId = this.#userId): Promise<void> {
    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(delete) User does not exist")

    await firestore().collection(this.#collectionName).doc(userId).delete()

    this.logout()
  }
}
