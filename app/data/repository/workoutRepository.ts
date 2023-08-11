import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { NewWorkout, Workout } from "../model/workoutModel"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository implements BaseRepository<NewWorkout | Workout> {
  _collectionName = "workouts"
  _firestoreClient: FirebaseFirestoreTypes.Module

  constructor(firebaseClient) {
    this._firestoreClient = firebaseClient
  }

  get(): Promise<Workout> {
    throw new Error("Method not implemented.")
  }

  async getMany?(workoutIds: string[]): Promise<Workout[]> {
    const results: FirebaseFirestoreTypes.QuerySnapshot[] = []
    while (workoutIds.length) {
      // Firestore limit "in" filter to 10 elements only
      const batchIds = workoutIds.splice(0, 10)
      const ref = await this._firestoreClient
        .collection(this._collectionName)
        .where(firestore.FieldPath.documentId(), "in", [...batchIds])
        .get()

      results.push(ref)
    }

    const workouts: Workout[] = []
    if (results.length) {
      results.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          workouts.push({
            workoutId: doc.id,
            ...doc.data(),
          } as Workout)
        })
      })
    }

    workouts.sort((a, b) => (a.endTime < b.endTime ? -1 : 1))

    return workouts
  }

  async create(workout: NewWorkout): Promise<string> {
    console.debug("WorkoutRepository.create workout:", workout)
    const workoutRef = await this._firestoreClient.collection(this._collectionName).add(workout)

    return workoutRef.id
  }

  updateById(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  delete(): Promise<void> {
    throw new Error("Method not implemented.")
  }
}
