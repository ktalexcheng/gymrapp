import firestore from "@react-native-firebase/firestore"
import { NewWorkout } from "../model/workoutModel"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository implements BaseRepository<NewWorkout> {
  #collectionName = "workouts"

  get(): Promise<NewWorkout> {
    throw new Error("Method not implemented.")
  }

  getMany?(): Promise<NewWorkout[]> {
    throw new Error("Method not implemented.")
  }

  async create(workout: NewWorkout): Promise<string> {
    console.debug("WorkoutRepository().create().workout:", workout)
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
