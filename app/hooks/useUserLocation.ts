import { LatLongCoords } from "app/data/types"
import { translate } from "app/i18n"
import * as Location from "expo-location"
import { useEffect, useState } from "react"
import { Alert, Linking } from "react-native"
import { useToast } from "./useToast"

/**
 * IMPORTANT: If testing on Android emulator, open Google Maps in order to capture GPS location
 * not sure why this is necessary but the location will never update otherwise
 */
export const useUserLocation = (): {
  userLocation: LatLongCoords | undefined
  isLocationPermissionGranted: boolean
  isGettingUserLocation: boolean
  refreshUserLocation: () => void
} => {
  const [userLocation, setUserLocation] = useState<LatLongCoords>()
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false)
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(false)
  const [getUserLocationRefreshKey, setGetUserLocationRefreshKey] = useState(0)
  const [toastShowTx] = useToast()

  const refreshUserLocation = () => {
    setGetUserLocationRefreshKey((prev) => prev + 1)
  }

  const showPermissionAlert = () => {
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
  }

  useEffect(() => {
    const getUserLocation = async () => {
      if (isGettingUserLocation) {
        return
      }

      setIsGettingUserLocation(true)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== Location.PermissionStatus.GRANTED) {
          setIsLocationPermissionGranted(false)
          setUserLocation(undefined)
          showPermissionAlert()
          return
        } else {
          setIsLocationPermissionGranted(true)
        }

        toastShowTx("userLocation.gettingUserLocationLabel")
        const location = await Location.getCurrentPositionAsync()
        setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude })
      } catch (e) {
        console.error("useUserLocation.useEffect [getUserLocationRefreshKey] error:", e)
        toastShowTx("userLocation.unableToAcquireLocationMessage")
      } finally {
        setIsGettingUserLocation(false)
      }
    }

    getUserLocation()
  }, [getUserLocationRefreshKey])

  return { userLocation, isLocationPermissionGranted, isGettingUserLocation, refreshUserLocation }
}
