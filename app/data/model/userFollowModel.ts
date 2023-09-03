interface UserFollow {
  followDate: Date
}

export interface UserFollowing extends UserFollow {}

export interface UserFollower extends UserFollow {}
