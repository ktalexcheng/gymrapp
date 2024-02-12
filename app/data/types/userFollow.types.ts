import { UserId } from "./user.types"

interface UserFollow {
  followDate: Date
}

export interface UserFollowing extends UserFollow {}

export interface UserFollowers extends UserFollow {}

export interface FollowRequest {
  requestId: string
  requestedByUserId: UserId
  requestDate: Date
  isAccepted: boolean
  isDeclined: boolean
}
