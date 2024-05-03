import { Activity, ActivityId } from "../types"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class ActivityRepository extends BaseRepository<Activity, ActivityId> {
  constructor(firebaseClient) {
    super("ActivityRepository", firebaseClient, "activities", "activityId")
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
