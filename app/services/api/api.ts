/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import functions, { FirebaseFunctionsTypes } from "@react-native-firebase/functions"
import { ApisauceInstance, create } from "apisauce"
import { AppLocale } from "app/data/constants"
import {
  FeedItemId,
  GymSearchResult,
  LatLongCoords,
  UserId,
  UserSearchResult,
  Workout,
  WorkoutId,
} from "app/data/model"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { getDistance } from "geolib"
import Config from "../../config"
import type {
  ApiConfig,
  GoogleMapsPlaceDetails,
  GoogleMapsPlacePrediction,
  PlaceId,
} from "./api.types"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
  firebaseFunctionsClient: functions(),
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig
  firebaseFunctionsClient: FirebaseFunctionsTypes.Module

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
    this.firebaseFunctionsClient = config.firebaseFunctionsClient
  }

  async getPlacePredictions(
    input: string,
    language: AppLocale,
    origin: LatLongCoords,
  ): Promise<GoogleMapsPlacePrediction[]> {
    try {
      const predictions = await this.firebaseFunctionsClient.httpsCallable(
        "mapsGetPlacePredictions",
      )({
        input,
        language,
        origin,
      })

      return predictions.data as GoogleMapsPlacePrediction[]
    } catch (e) {
      console.error("getPlacePredictions error:", e)
      throw new Error("Error getting place predictions.")
    }
  }

  async getPlaceDetails(placeId: PlaceId): Promise<GoogleMapsPlaceDetails> {
    try {
      const placeDetails = await this.firebaseFunctionsClient.httpsCallable("mapsGetPlaceDetails")({
        placeId,
      })

      return placeDetails.data as GoogleMapsPlaceDetails
    } catch (e) {
      console.error("getPlaceDetails error:", e)
      throw new Error("Error getting place details.")
    }
  }

  async searchGyms(query: string): Promise<GymSearchResult[]> {
    try {
      const gyms = await this.firebaseFunctionsClient.httpsCallable("gymSearchByString")({
        searchString: query,
      })
      const searchResult = gyms.data as GymSearchResult[]

      return searchResult
    } catch (e) {
      console.error("searchGyms error:", e)
      throw new Error("Error searching gyms.")
    }
  }

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    try {
      const users = await this.firebaseFunctionsClient.httpsCallable("userSearchByString")({
        searchString: query,
      })
      const searchResult = users.data as UserSearchResult[]

      return searchResult
    } catch (e) {
      console.error("searchUsers error:", e)
      throw new Error("Error searching users.")
    }
  }

  getDistanceBetweenLocations(gpsLatLng1, gpsLatLng2) {
    return getDistance(gpsLatLng1, gpsLatLng2)
  }

  // async getOtherUser(userId: UserId): Promise<User> {
  //   try {
  //     const reponse = await this.firebaseFunctionsClient.httpsCallable("userGetOtherUser")({
  //       userId,
  //     })
  //     return reponse.data.user
  //   } catch (e) {
  //     console.error("getOtherUser error:", e)
  //     throw new Error("Error getting other user profile.")
  //   }
  // }

  async getOtherUserWorkouts(
    userId: UserId,
    lastWorkoutId?: WorkoutId,
  ): Promise<{ lastWorkoutId: WorkoutId; noMoreItems: boolean; workouts: Workout[] }> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable(
        "workoutGetOtherUserWorkouts",
      )({
        userId,
        lastWorkoutId,
      })

      return {
        lastWorkoutId: response.data.lastWorkoutId,
        noMoreItems: response.data.noMoreItems,
        workouts: convertFirestoreTimestampToDate(response.data.workouts),
      }
    } catch (e) {
      console.error("getOtherUserWorkouts error:", e)
      throw new Error("Error getting other user workouts.")
    }
  }

  async getFeedWorkouts(
    lastFeedItemId?: FeedItemId,
  ): Promise<{ lastFeedItemId: FeedItemId; noMoreItems: boolean; workouts: Workout[] }> {
    try {
      const reponse = await this.firebaseFunctionsClient.httpsCallable("workoutGetFeedWorkouts")({
        lastFeedItemId,
      })

      return {
        lastFeedItemId: reponse.data.lastFeedItemId,
        noMoreItems: reponse.data.noMoreItems,
        workouts: convertFirestoreTimestampToDate(reponse.data.workouts),
      }
    } catch (e) {
      console.error("getFeedWorkouts error:", e)
      throw new Error("Error getting user feed workouts.")
    }
  }

  async requestFollowOtherUser(userId: UserId): Promise<void> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable(
        "feedRequestFollowOtherUser",
      )({
        userId,
      })

      // response data could be:
      // { status: "pending", requestId: "123" }
      // { status: "success", requestId: null }
      return convertFirestoreTimestampToDate(response.data)
    } catch (e) {
      console.error("requestFollowOtherUser error:", e)
      throw new Error("Error requesting to follow other user.")
    }
  }

  async acceptFollowRequest(userId: UserId): Promise<void> {
    try {
      await this.firebaseFunctionsClient.httpsCallable("feedAcceptFollowRequest")({
        userId,
      })
    } catch (e) {
      console.error("acceptFollowRequest error:", e)
      throw new Error("Error accepting follow request.")
    }
  }

  async unfollowOtherUser(userId: UserId): Promise<void> {
    try {
      await this.firebaseFunctionsClient.httpsCallable("feedUnfollowOtherUser")({
        userId,
      })
    } catch (e) {
      console.error("unfollowOtherUser error:", e)
      throw new Error("Error unfollowing other user.")
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
