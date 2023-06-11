import auth from "@react-native-firebase/auth"
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExerciseSettings, User, WorkoutMetadata } from "../model"
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

  set userId(_: string) {
    console.warn(
      "Do not manually set userId. This should be done automatically with the get() method.",
    )
  }

  get user(): User {
    return this.#user
  }

  set user(user: User) {
    this.#user = user
    this.update()
  }

  get userExerciseSettings(): {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[] {
    if (!this.#user) {
      console.error("UserRepository.get userExerciseSettings() error: No user set")
      return undefined
    }

    return this.#user.preferences?.allExerciseSettings
  }

  set userExerciseSettings(
    allExerciseSettings: {
      exerciseId: string
      exerciseSettings: ExerciseSettings
    }[],
  ) {
    if (!this.#user) {
      console.error("UserRepository.set userExerciseSettings() error: No user set")
      return
    }

    if (this.#user.preferences) {
      this.#user.preferences = {}
    }
    this.#user.preferences.allExerciseSettings = allExerciseSettings
    this.update()
  }

  get userWorkouts(): WorkoutMetadata {
    if (!this.#user) {
      console.error("UserRepository.get userWorkouts() error: No user set")
      return undefined
    }

    return this.#user.workouts
  }

  set userWorkouts(workoutMeta: WorkoutMetadata) {
    if (!this.#user) {
      console.error("UserRepository.set userWorkouts() error: No user set")
      return
    }

    if (this.#user.workouts === undefined) {
      this.#user.workouts = {}
    }

    Object.keys(workoutMeta).forEach((k) => {
      this.#user.workouts[k] = workoutMeta[k]
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
    if (!snapshot.exists) throw new RepositoryError("(get) User does not exist")

    const data = snapshot.data()
    this.#user = {
      userId,
      privateAccount: data.privateAccount,
      firstName: data.firstName,
      lastName: data.lastName,
      preferences: data.preferences,
      providerId: data.providerId,
      email: data.email,
      photoUrl: data.photoUrl,
    }

    return this.#user
  }

  async create(user: User): Promise<void> {
    this.#userId = user.userId

    const snapshot = await this._getUserSnapshot()
    if (snapshot.exists) throw new RepositoryError("(create) User already exists")

    firestore().collection(this.#collectionName).doc(this.#userId).set(user)
  }

  async update(userId = this.#userId, user = this.#user): Promise<void> {
    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(update) User does not exist")

    // const payload = user
    // Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    await firestore().collection(this.#collectionName).doc(userId).update(user)
  }

  async delete(userId = this.#userId): Promise<void> {
    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(delete) User does not exist")

    await firestore().collection(this.#collectionName).doc(userId).delete()
    this.logout()
  }
}
