import { Workout, WorkoutId } from "../model/workoutModel"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository extends BaseRepository<Workout, WorkoutId> {
  constructor(firebaseClient) {
    super("WorkoutRepository", firebaseClient, "workouts", "workoutId")
  }
}
