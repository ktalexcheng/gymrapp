// Repository for feed data

import { FeedItemId, UserFeedItem } from "../model"
import { BaseRepository } from "./baseRepository"

export class FeedRepository extends BaseRepository<UserFeedItem, FeedItemId> {
  constructor(firestoreClient) {
    super("FeedRepository", firestoreClient, "feeds", "feedItemId")
  }

  async get(id: string, refresh = false): Promise<UserFeedItem> {
    const user = super.get(id, refresh)

    return user
  }
}
