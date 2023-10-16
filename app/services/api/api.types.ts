import { FirebaseFunctionsTypes } from "@react-native-firebase/functions"

/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export type PlaceId = string
export interface GoogleMapsPlacePrediction {
  place_id: PlaceId
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}
export interface GoogleMapsPlaceDetails {
  place_id: PlaceId
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  opening_hours: {
    open_now: boolean
    weekday_text: string[]
  }
  plus_code: {
    compound_code: string
    global_code: string
  }
  website: string
  icon: string
  icon_background_color: string
  icon_mask_base_uri: string
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number

  /**
   * Firebase functions client
   */
  firebaseFunctionsClient: FirebaseFunctionsTypes.Module
}
