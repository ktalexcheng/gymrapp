import { ActivityId } from "./activity.types"
import { ExercisePerformed } from "./exercise.types"
import { baseMetadata } from "./metadata.types"
import { UserId } from "./user.types"

export type CommentId = string

export interface WorkoutComment extends baseMetadata {
  commentId: CommentId
  byUserId: UserId
  comment: string
}

export type WorkoutId = string

export interface Workout extends baseMetadata {
  workoutId: WorkoutId
  isEdited?: boolean
  byUserId: UserId
  userIsPrivate: boolean
  isHidden: boolean
  startTime: Date
  endTime: Date
  exercises: ExercisePerformed[]
  workoutTitle: string
  activityId: ActivityId
  performedAtGymId?: string
  performedAtGymName?: string
}

export interface WorkoutInteraction extends baseMetadata {
  workoutId: WorkoutId
  workoutByUserId: UserId
  comments?: WorkoutComment[]
  likedByUserIds?: UserId[]
  reportedCommentIds?: Record<CommentId, number>
}
