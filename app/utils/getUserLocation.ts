import { LatLongCoords } from "app/data/types"
import { translate } from "app/i18n"
import * as Location from "expo-location"
import { Alert, Linking } from "react-native"
import { logError } from "./logger"

export async function getUserLocation() {
  let locationPermissionStatus = Location.PermissionStatus.UNDETERMINED
  let location: LatLongCoords

  try {
    console.debug("getUserLocation: requesting location permission")
    const permission = await Location.requestForegroundPermissionsAsync()
    locationPermissionStatus = permission.status
    console.debug("getUserLocation: permission status:", { locationPermissionStatus })
    if (locationPermissionStatus !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        translate("userLocation.locationPermissionRequiredTitle"),
        translate("userLocation.locationPermissionRequiredMessage"),
        [
          {
            text: translate("userLocation.goToAppSettingsButtonLabel"),
            style: "default",
            onPress: () => {
              Linking.openSettings()
              // Calling refreshUserLocation() here will basically force the user to
              // enable location services, we don't want to do that for now
              // refreshUserLocation()
            },
          },
          {
            text: translate("common.ok"),
            style: "cancel",
            onPress: () => {},
          },
        ],
      )

      console.debug("getUserLocation: no permission", { locationPermissionStatus })
      return {
        locationPermissionStatus,
        location: undefined,
      }
    }

    let _location = await Location.getLastKnownPositionAsync({
      maxAge: 1000 * 60, // 1 minute in milliseconds
    })
    if (!_location) {
      _location = await Location.getCurrentPositionAsync()
    }
    location = { lat: _location.coords.latitude, lng: _location.coords.longitude }
    console.debug("getUserLocation: returning location", { location })
    return {
      locationPermissionStatus,
      location,
    }
  } catch (e) {
    logError(e, "getUserLocation error")
  }

  console.debug("getUserLocation: returning undefined location")
  return undefined
}
