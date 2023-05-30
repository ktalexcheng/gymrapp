import firestore from "@react-native-firebase/firestore"
import { Exercise } from "../model"
import { IBaseRepository } from "./baseRepository"

export class ExerciseRepository implements IBaseRepository<Exercise> {
  get(): Promise<Exercise> {
    throw new Error("Method not implemented.")
  }

  create(): Promise<void> {
    throw new Error("Method not implemented.")
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
      const { type: _type, category: _cat, exerciseName: _name } = e.data()

      exercises.push(<Exercise>{
        exerciseSource: "Public",
        exerciseId: e.id,
        exerciseType: _type,
        exerciseCategory: _cat,
        exerciseName: _name,
      })
    })

    return exercises
  }
}
