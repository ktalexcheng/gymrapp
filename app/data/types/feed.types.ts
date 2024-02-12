import { UserId } from "./user.types"
import { WorkoutId } from "./workout.types"

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
