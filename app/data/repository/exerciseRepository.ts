import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { Exercise, NewExercise } from "../model"
import { BaseRepository } from "./baseRepository"

export class ExerciseRepository implements BaseRepository<Exercise> {
  _collectionName = "exercises"
  _firestoreClient: FirebaseFirestoreTypes.Module

  constructor(firebaseClient) {
    this._firestoreClient = firebaseClient
  }

  get(): Promise<Exercise> {
    throw new Error("Method not implemented.")
  }

  async create(newExercise: NewExercise): Promise<void> {
    const exercisesCollection = this._firestoreClient.collection(this._collectionName)

    await exercisesCollection
      .add(newExercise)
      .catch((e) => console.error("ExerciseRepository.create error:", e))
  }

  updateById(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  delete(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  async getMany(): Promise<Exercise[] | null> {
    const exercisesCollection = this._firestoreClient.collection(this._collectionName)
    const exercisesSnapshot = await exercisesCollection.get()

    if (exercisesSnapshot.empty) return null

    const exercises: Exercise[] = []
    exercisesSnapshot.forEach((e) => {
      const exercise = e.data()

      exercises.push(<Exercise>{
        exerciseSource: "Public",
        exerciseId: e.id,
        activityName: exercise.activityName,
        exerciseCat1: exercise.exerciseCat1,
        exerciseCat2: exercise.exerciseCat2,
        exerciseName: exercise.exerciseName,
      })
    })

    return exercises
  }
}
