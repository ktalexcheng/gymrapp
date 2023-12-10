import { ActivityId } from "./activityModel"
import { baseMetadata } from "./baseModel"
import { ExercisePerformed } from "./exerciseModel"
import { UserId } from "./userModel"

export type CommentId = string

export interface WorkoutComment extends baseMetadata {
  commentId: CommentId
  byUserId: UserId
  comment: string
}

export type WorkoutId = string

export interface NewWorkout extends baseMetadata {
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

export interface Workout extends NewWorkout {
  workoutId: WorkoutId
  // comments?: WorkoutComment[]
  // likedByUserIds?: UserId[]
}

export interface WorkoutInteraction extends baseMetadata {
  workoutId: WorkoutId
  workoutByUserId: UserId
  comments?: WorkoutComment[]
  likedByUserIds?: UserId[]
}

export function isWorkout(value: unknown): value is Workout {
  return value && typeof value === "object" && (value as Workout).workoutId !== undefined
}
