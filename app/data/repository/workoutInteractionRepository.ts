import { WorkoutId, WorkoutInteraction } from "../model/workoutModel"
import { BaseRepository } from "./baseRepository"

export class WorkoutInteractionRepository extends BaseRepository<WorkoutInteraction, WorkoutId> {
  constructor(firebaseClient) {
    super("WorkoutInteractionRepository", firebaseClient, "workoutInteractions", "workoutId")
  }
}
