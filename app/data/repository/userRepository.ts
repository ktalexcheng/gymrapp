import auth from "@react-native-firebase/auth"
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExerciseSettings, IUser } from "../model"
import { IBaseRepository, RepositoryError } from "./baseRepository"

export class UserRepository implements IBaseRepository<IUser> {
  #userId: string
  #user: IUser

  _getCurrentUser(): FirebaseFirestoreTypes.DocumentReference {
    if (!auth().currentUser) throw new RepositoryError("No user signed in")
    return firestore().collection("users").doc(this.#userId)
  }

  async _getUserSnapshot(): Promise<FirebaseFirestoreTypes.DocumentSnapshot> {
    const userRef = this._getCurrentUser()
    const userSnapshot = await userRef.get()
    return userSnapshot
  }

  // setUserId(userId: string) {
  //   this.#userId = userId
  // }

  getUserExerciseSettings(): {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[] {
    if (!this.#user) {
      console.error("UserRepository.getUserExerciseSettings() error: No user set")
      return undefined
    }
    return this.#user.preferences?.allExerciseSettings
  }

  updateUserExerciseSettings(
    allExerciseSettings: {
      exerciseId: string
      exerciseSettings: ExerciseSettings
    }[],
  ) {
    if (!this.#user) {
      console.error("UserRepository.updateUserExerciseSettings() error: No user set")
      return undefined
    }

    if (this.#user.preferences) {
      this.#user.preferences = {}
    }
    this.#user.preferences.allExerciseSettings = allExerciseSettings
  }

  async get(userId = this.#userId): Promise<IUser> {
    this.#userId = userId
    const snapshot = await this._getUserSnapshot()
    if (!snapshot.exists) throw new RepositoryError("(get) User does not exist")

    const data = snapshot.data()
    this.#user = {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      preferences: data.preferences,
      providerId: data.providerId,
      email: data.email,
      photoUrl: data.photoUrl,
    }

    return this.#user
  }

  async create(user: IUser): Promise<void> {
    const snapshot = await this._getUserSnapshot()

    if (snapshot.exists) throw new RepositoryError("(create) User already exists")

    firestore().collection("users").doc(this.#userId).set(user)
  }

  async update(_userId = this.#userId, _user = this.#user): Promise<void> {
    const snapshot = await this._getUserSnapshot()

    if (!snapshot.exists) throw new RepositoryError("(update) User does not exist")

    const payload = _user
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    console.debug("Payload to update user data:", payload)
    await firestore().collection("users").doc(_userId).update(payload)
  }

  async delete(_userId = this.#userId): Promise<void> {
    const snapshot = await this._getUserSnapshot()

    if (!snapshot.exists) throw new RepositoryError("(delete) User does not exist")

    await firestore().collection("users").doc(_userId).delete()
  }
}
