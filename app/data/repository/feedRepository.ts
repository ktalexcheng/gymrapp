// Repository for feed data

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { FeedItemId, UserFeedItem } from "../model"
import { BaseRepository } from "./baseRepository"

export class FeedRepository extends BaseRepository<UserFeedItem, FeedItemId> {
  constructor(firestoreClient: FirebaseFirestoreTypes.Module) {
    super("FeedRepository", firestoreClient, "feeds", "feedItemId")
  }
}
