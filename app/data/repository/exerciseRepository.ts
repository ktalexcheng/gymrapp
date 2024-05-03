import { Exercise, ExerciseId } from "../types"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class ExerciseRepository extends BaseRepository<Exercise, ExerciseId> {
  constructor(firebaseClient) {
    super("ExerciseRepository", firebaseClient, "exercises", "exerciseId")
  }

  create(): never {
    throw new RepositoryError(this.repositoryId, "Method not allowed.")
  }

  update(): never {
    throw new RepositoryError(this.repositoryId, "Method not allowed.")
  }

  delete(): never {
    throw new RepositoryError(this.repositoryId, "Method not allowed.")
  }
}
