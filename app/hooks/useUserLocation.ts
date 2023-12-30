import { LatLongCoords } from "app/data/model"
import { translate } from "app/i18n"
import * as Location from "expo-location"
import { useEffect, useState } from "react"
import { Alert, Linking } from "react-native"

/**
 * IMPORTANT: If testing on Android emulator, open Google Maps in order to capture GPS location
 * not sure why this is necessary but the location will never update otherwise
 */
export const useUserLocation = (): {
  userLocation: LatLongCoords
  isLocationPermissionGranted: boolean
  isGettingUserLocation: boolean
  refreshUserLocation: () => void
} => {
  const [userLocation, setUserLocation] = useState<LatLongCoords>(null)
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false)
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(true)
  const [getUserLocationRefreshKey, setGetUserLocationRefreshKey] = useState(0)
  const [permissionAlertRefreshKey, setPermissionAlertRefreshKey] = useState(0)

  const refreshUserLocation = () => {
    setGetUserLocationRefreshKey((prev) => prev + 1)
  }

  const showPermissionAlert = () => {
    setPermissionAlertRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    if (permissionAlertRefreshKey === 0) return
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
  }, [permissionAlertRefreshKey])

  useEffect(() => {
    const getUserLocation = async () => {
      setIsGettingUserLocation(true)

      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== Location.PermissionStatus.GRANTED) {
          console.debug("useUserLocation [getUserLocationRefreshKey] status !== granted")
          setIsLocationPermissionGranted(false)
          setUserLocation(null)
          showPermissionAlert()
          return
        }

        const location = await Location.getCurrentPositionAsync({})
        console.debug("useUserLocation [getUserLocationRefreshKey] location:", location)
        setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude })
      } catch (e) {
        console.error("useUserLocation [getUserLocationRefreshKey] error:", e)
      } finally {
        setIsGettingUserLocation(false)
      }
    }

    getUserLocation()
  }, [getUserLocationRefreshKey])

  return { userLocation, isLocationPermissionGranted, isGettingUserLocation, refreshUserLocation }
}
