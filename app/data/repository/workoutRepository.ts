import firestore from "@react-native-firebase/firestore"
import { NewWorkout, Workout } from "../model/workoutModel"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository implements BaseRepository<NewWorkout | Workout> {
  #collectionName = "workouts"

  get(): Promise<Workout> {
    throw new Error("Method not implemented.")
  }

  async getMany?(workoutIds: string[]): Promise<Workout[]> {
    const workoutRef = await firestore()
      .collection(this.#collectionName)
      .where(firestore.FieldPath.documentId(), "in", workoutIds)
      .get()

    const workouts: Workout[] = []
    if (!workoutRef.empty) {
      workoutRef.forEach((doc) => {
        workouts.push({
          workoutId: doc.id,
          ...doc.data(),
        } as Workout)
      })
    }

    workouts.sort((a, b) => (a.endTime < b.endTime ? -1 : 1))

    return workouts
  }

  async create(workout: NewWorkout): Promise<string> {
    const workoutRef = await firestore().collection(this.#collectionName).add(workout)

    return workoutRef.id
  }

  update(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  delete(): Promise<void> {
    throw new Error("Method not implemented.")
  }
}
