import { GymDetails, GymId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class GymRepository extends BaseRepository<GymDetails, GymId> {
  constructor(firestoreClient) {
    super("GymRepository", firestoreClient, "gyms", "gymId")
  }

  delete(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }
}
