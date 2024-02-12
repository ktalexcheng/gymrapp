import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { GoogleMapsPlaceDetails, PlaceId } from "app/services/api"
import { baseMetadata } from "./metadata.types"
import { UserId } from "./user.types"

export interface GymRecord extends baseMetadata {
  rank: number
  holderUid: UserId
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

export type GymId = PlaceId

export interface Gym {
  gymId: GymId
  gymName: string
}

export interface GymDetails extends baseMetadata {
  gymId: GymId
  gymName: string
  googleMapsPlaceDetails: GoogleMapsPlaceDetails
  gymLocation: FirebaseFirestoreTypes.GeoPoint
  gymMembersCount: number
  gymWorkoutsCount: number
  gymLeaderboard: GymLeaderboard
}

export interface GymSearchResult {
  gymId: GymId
  gymName: string
  gymAddress: string
  gymMembersCount: number
  gymWorkoutsCount: number
  gymIconUrl: string
  gymIconBackgroundColor: string
}

export interface GymMember {
  userId: UserId
  dateAdded: Date
  workoutsCount: number
}
