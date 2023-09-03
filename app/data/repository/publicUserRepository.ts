import { User, UserId } from "../model"
import { BaseRepository } from "./baseRepository"

export class PublicUserRepository extends BaseRepository<User, UserId> {
  constructor(firebaseClient) {
    super("PublicUserRepository", firebaseClient, "usersPublic", "userId")
  }

  create(): never {
    throw new Error("Method not allowed.")
  }

  update(): never {
    throw new Error("Method not allowed.")
  }

  delete(): never {
    throw new Error("Method not allowed.")
  }
}
