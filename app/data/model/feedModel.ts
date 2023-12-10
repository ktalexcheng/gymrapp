import { UserId } from "./userModel"
import { WorkoutId } from "./workoutModel"

export type FeedItemId = string

export interface UserFeedItem {
  feedItemId: FeedItemId // feedItemId is the same as workoutId
  byUserId: UserId
  startTime: Date
  workoutId: WorkoutId
}

// export interface UserFeed {
//   lastUpdated: Date
//   feedItems: UserFeedItem[]
// }
