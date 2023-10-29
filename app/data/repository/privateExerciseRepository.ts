import { Exercise, ExerciseId } from "../model"
import { BaseRepository } from "./baseRepository"

export class PrivateExerciseRepository extends BaseRepository<Exercise, ExerciseId> {
  constructor(firebaseClient?) {
    super("PrivateExerciseRepository", firebaseClient, null, "exerciseId")
  }

  setUserId(userId: string): void {
    super.setCollectionPath(`users/${userId}/exercises`)
  }
}
