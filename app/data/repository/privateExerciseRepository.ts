import { Exercise, ExerciseId } from "../types"
import { BaseRepository } from "./baseRepository"

export class PrivateExerciseRepository extends BaseRepository<Exercise, ExerciseId> {
  constructor(firebaseClient) {
    super("PrivateExerciseRepository", firebaseClient, null, "exerciseId")
  }

  setUserId(userId?: string): void {
    super.setCollectionPath(userId ? `users/${userId}/exercises` : undefined)
  }
}
