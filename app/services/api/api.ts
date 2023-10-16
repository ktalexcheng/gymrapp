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
import { GymSearchResult, LatLongCoords } from "app/data/model"
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

  getDistanceBetweenLocations(gpsLatLng1, gpsLatLng2) {
    return getDistance(gpsLatLng1, gpsLatLng2)
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
