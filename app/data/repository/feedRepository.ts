// Repository for feed data

import { FeedItemId, UserFeedItem } from "../model"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class FeedRepository extends BaseRepository<UserFeedItem, FeedItemId> {
  constructor(firestoreClient) {
    super("FeedRepository", firestoreClient, null, "feedItemId")
  }

  setUserId(userId: string): void {
    super.setCollectionPath(`feeds/${userId}/feedItems`)
  }

  create(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }

  delete(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }
}
