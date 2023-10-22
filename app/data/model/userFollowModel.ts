interface UserFollow {
  followDate: Date
}

export interface UserFollowing extends UserFollow {}

export interface UserFollowers extends UserFollow {}
