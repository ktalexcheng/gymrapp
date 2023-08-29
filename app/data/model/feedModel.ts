import { WorkoutId } from "./workoutModel"

export type FeedItemId = string

export interface UserFeedItem {
  feedItemId: FeedItemId // feedItemId is composed of ${workoutDate}-${byUserId}
  workoutId: WorkoutId
}

export interface UserFeed {
  lastUpdated: Date
  feedItems: UserFeedItem[]
}
