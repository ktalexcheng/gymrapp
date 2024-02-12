import { Workout, WorkoutId } from "../types/workout.types"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository extends BaseRepository<Workout, WorkoutId> {
  constructor(firebaseClient) {
    super("WorkoutRepository", firebaseClient, "workouts", "workoutId")
  }
}
