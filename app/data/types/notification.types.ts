import { UserId } from "./user.types"
import { WorkoutId } from "./workout.types"

export enum NotificationType {
  Comment = "comment",
  Like = "like",
  FollowRequest = "followRequest",
  FollowAccepted = "followAccepted",
  NewActivity = "newActivity",
}

export type NotificationId = string

export interface BaseNotification {
  notificationId: NotificationId
  notificationDate: Date
  isRead: boolean
  senderUserId: UserId
}

export interface CommentNotification extends BaseNotification {
  notificationType: NotificationType.Comment
  workoutId: WorkoutId
}

export interface LikeNotification extends BaseNotification {
  notificationType: NotificationType.Like
  workoutId: WorkoutId
}

export interface FollowRequestNotification extends BaseNotification {
  notificationType: NotificationType.FollowRequest
}

export interface FollowAcceptedNotification extends BaseNotification {
  notificationType: NotificationType.FollowAccepted
}

export type Notification =
  | CommentNotification
  | LikeNotification
  | FollowRequestNotification
  | FollowAcceptedNotification
