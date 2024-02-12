// Repository for feed data

import { FeedItemId, UserFeedItem } from "../types"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class FeedRepository extends BaseRepository<UserFeedItem, FeedItemId> {
  #userId?: string

  constructor(firestoreClient) {
    super("FeedRepository", firestoreClient, null, "feedItemId")
  }

  setUserId(userId: string): void {
    this.#userId = userId
    super.setCollectionPath(`feeds/${userId}/feedItems`)
  }

  create(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }

  delete(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }
}
