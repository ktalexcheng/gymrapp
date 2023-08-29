import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { UserId } from "./userModel"

export interface GymRecord {
  rank: number
  holderUid: UserId
  date: Date | FirebaseFirestoreTypes.Timestamp
  gymId: string
}

export interface WeightRecord extends GymRecord {
  maxWeight: number
}

export interface VolumeRecord extends GymRecord {
  reps: number
  weight: number
}

export interface GymLeaderboard {
  weightRecord: Record<number, WeightRecord>
  volumeRecord: Record<number, VolumeRecord>
}

export type GymId = string

export interface Gym {
  gymId: GymId
  gymLocation: FirebaseFirestoreTypes.GeoPoint
  gymName: string
  gymMembers: string[]
  gymLeaderboard: GymLeaderboard
}
