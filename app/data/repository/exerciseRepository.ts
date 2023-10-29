import { Exercise, ExerciseId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class ExerciseRepository extends BaseRepository<Exercise, ExerciseId> {
  constructor(firebaseClient?) {
    super("ExerciseRepository", firebaseClient, "exercises", "exerciseId")
  }

  create(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }

  update(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }

  delete(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }
}
