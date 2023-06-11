import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"

export interface GymRecord {
  rank: number
  holderUid: string
  date: Date
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

export interface Gym {
  gymId: string
  gymLocation: FirebaseFirestoreTypes.GeoPoint
  gymName: string
  gymMembers: string[]
  gymLeaderboard: GymLeaderboard
}
