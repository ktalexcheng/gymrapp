import { WorkoutId, WorkoutInteraction } from "../types/workout.types"
import { BaseRepository } from "./baseRepository"

export class WorkoutInteractionRepository extends BaseRepository<WorkoutInteraction, WorkoutId> {
  constructor(firebaseClient) {
    super("WorkoutInteractionRepository", firebaseClient, "workoutInteractions", "workoutId")
  }
}
