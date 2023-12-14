import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { GoogleMapsPlaceDetails, PlaceId } from "app/services/api"
import { baseMetadata } from "./baseModel"
import { UserId } from "./userModel"

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

export interface Gym extends baseMetadata {
  gymId: GymId
  gymName: string
}

export interface GymDetails extends Gym {
  // gymId: GymId
  // gymName: string
  googleMapsPlaceDetails: GoogleMapsPlaceDetails
  gymLocation: FirebaseFirestoreTypes.GeoPoint
  gymMembersCount: number
  gymLeaderboard: GymLeaderboard
}

export interface GymSearchResult {
  gymId: GymId
  gymName: string
  gymAddress: string
  gymMembersCount: number
  gymIconUrl: string
  gymIconBackgroundColor: string
}

export interface GymMember {
  userId: UserId
  dateAdded: Date
  workoutCount: number
}
