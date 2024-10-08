/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import functions, { FirebaseFunctionsTypes } from "@react-native-firebase/functions"
import { ApisauceInstance, create } from "apisauce"
import { AppLocale, UserErrorType } from "app/data/constants"
import {
  FeedItemId,
  GymId,
  GymSearchResult,
  LatLongCoords,
  UserId,
  UserSearchResult,
  Workout,
  WorkoutId,
} from "app/data/types"
import { IWorkoutSummaryModel } from "app/stores"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { logError } from "app/utils/logger"
import * as Application from "expo-application"
import { getDistance } from "geolib"
import { Platform } from "react-native"
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

  async checkForUpdates(exercisesLastUpdate?: Date): Promise<{
    updateAvailable: boolean
    updateLink: string
    forceUpdate: boolean
    exercisesUpdateAvailable: boolean
  }> {
    try {
      const requestData = {
        appPlatform: Platform.OS,
        appVersion: Application.nativeApplicationVersion,
        buildVersion: Application.nativeBuildVersion,
        exercisesLastUpdate,
      }
      console.debug("checkForUpdates current app version:", requestData)
      const response = await this.firebaseFunctionsClient.httpsCallable<any, any>(
        "appCheckForUpdates",
      )(requestData)

      console.debug("checkForUpdates response:", response)
      return response.data
    } catch (e) {
      logError(e, "checkForUpdates error")
      throw e
    }
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
      logError(e, "getPlacePredictions error")
      throw e
    }
  }

  async getPlaceDetails(placeId: PlaceId): Promise<GoogleMapsPlaceDetails> {
    try {
      const placeDetails = await this.firebaseFunctionsClient.httpsCallable("mapsGetPlaceDetails")({
        placeId,
      })

      return placeDetails.data as GoogleMapsPlaceDetails
    } catch (e) {
      logError(e, "getPlaceDetails error")
      throw e
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
      logError(e, "searchGyms error")
      throw e
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
      logError(e, "searchUsers error")
      throw e
    }
  }

  getDistanceBetweenLocations(gpsLatLng1, gpsLatLng2) {
    return getDistance(gpsLatLng1, gpsLatLng2)
  }

  async getOtherUserWorkout(workoutId: WorkoutId): Promise<Workout> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable(
        "workoutGetOtherUserWorkout",
      )({
        workoutId,
      })

      return {
        ...convertFirestoreTimestampToDate(response.data),
      }
    } catch (e) {
      logError(e, "getOtherUserWorkout error")
      throw e
    }
  }

  async getOtherUserWorkouts(
    userId: UserId,
    lastWorkoutId?: WorkoutId,
  ): Promise<{ lastWorkoutId: WorkoutId; noMoreItems: boolean; workouts: Workout[] }> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable<any, any>(
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
      logError(e, "getOtherUserWorkouts error")
      throw e
    }
  }

  async getFeedWorkouts(
    lastFeedItemId?: FeedItemId,
  ): Promise<{ lastFeedItemId: FeedItemId; noMoreItems: boolean; workouts: Workout[] }> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable<any, any>(
        "workoutGetFeedWorkouts",
      )({
        lastFeedItemId,
      })

      return {
        lastFeedItemId: response.data.lastFeedItemId,
        noMoreItems: response.data.noMoreItems,
        workouts: convertFirestoreTimestampToDate(response.data.workouts),
      }
    } catch (e) {
      logError(e, "getFeedWorkouts error")
      throw e
    }
  }

  async getGymWorkouts(
    gymId: GymId,
    lastWorkoutId?: WorkoutId,
  ): Promise<{ lastWorkoutId: WorkoutId; noMoreItems: boolean; workouts: IWorkoutSummaryModel[] }> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable<any, any>(
        "workoutGetGymWorkouts",
      )({
        gymId,
        lastWorkoutId,
      })

      return {
        lastWorkoutId: response.data.lastWorkoutId,
        noMoreItems: response.data.noMoreItems,
        workouts: convertFirestoreTimestampToDate(response.data.workouts),
      }
    } catch (e) {
      logError(e, "getGymWorkouts error")
      throw e
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
      logError(e, "requestFollowOtherUser error")
      throw e
    }
  }

  async acceptFollowRequest(userId: UserId): Promise<void> {
    try {
      await this.firebaseFunctionsClient.httpsCallable("feedAcceptFollowRequest")({
        userId,
      })
    } catch (e) {
      logError(e, "acceptFollowRequest error")
      throw e
    }
  }

  async unfollowOtherUser(userId: UserId): Promise<void> {
    try {
      await this.firebaseFunctionsClient.httpsCallable("feedUnfollowOtherUser")({
        userId,
      })
    } catch (e) {
      logError(e, "unfollowOtherUser error")
      throw e
    }
  }

  async updateUserHandle(
    userHandle: string,
  ): Promise<"success" | UserErrorType.UserHandleAlreadyTakenError> {
    try {
      const response = await this.firebaseFunctionsClient.httpsCallable<any, any>(
        "userUpdateUserHandle",
      )({
        userHandle,
      })
      console.debug("updateUserHandle response:", response)
      return response.data.status
    } catch (e) {
      logError(e, "updateUserHandle error")
      throw e
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
