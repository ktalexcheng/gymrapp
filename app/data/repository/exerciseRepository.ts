import firestore from "@react-native-firebase/firestore"
import { Exercise, NewExercise } from "../model"
import { BaseRepository } from "./baseRepository"

export class ExerciseRepository implements BaseRepository<Exercise> {
  get(): Promise<Exercise> {
    throw new Error("Method not implemented.")
  }

  async create(newExercise: NewExercise): Promise<void> {
    const exercisesCollection = firestore().collection("exercises")

    await exercisesCollection
      .add(newExercise)
      .catch((e) => console.error("ExerciseRepository.create error:", e))
  }

  update(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  delete(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  async getMany(): Promise<Exercise[] | null> {
    const exercisesCollection = firestore().collection("exercises")
    const exercisesSnapshot = await exercisesCollection.get()

    if (exercisesSnapshot.empty) return null

    const exercises: Exercise[] = []
    exercisesSnapshot.forEach((e) => {
      const exercise = e.data()

      exercises.push(<Exercise>{
        exerciseSource: "Public",
        exerciseId: e.id,
        exerciseType: exercise.exerciseType,
        exerciseSubtype: exercise.exerciseSubtype,
        exerciseCategory: exercise.exerciseCategory,
        exerciseName: exercise.exerciseName,
      })
    })

    return exercises
  }
}
