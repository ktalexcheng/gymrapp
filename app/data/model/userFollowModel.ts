interface UserFollow {
  followDate: Date | FirebaseFirestore.Timestamp
}

export interface UserFollowing extends UserFollow {}

export interface UserFollower extends UserFollow {}
