import { Activity, ActivityId } from "../model/activityModel"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class ActivityRepository extends BaseRepository<Activity, ActivityId> {
  constructor(firebaseClient?) {
    super("ActivityRepository", firebaseClient, "activities", "activityId")
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
