import { User, UserId } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class PublicUserRepository extends BaseRepository<User, UserId> {
  constructor(firebaseClient) {
    super("PublicUserRepository", firebaseClient, "usersPublic", "userId")
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
