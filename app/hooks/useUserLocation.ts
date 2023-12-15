import { LatLongCoords } from "app/data/model"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"
import { Alert } from "react-native"

/**
 * IMPORTANT: If testing on Android emulator, open Google Maps in order to capture GPS location
 * not sure why this is necessary but the location will never update otherwise
 */
export const useUserLocation = (): [
  userLocation: LatLongCoords,
  isGettingUserLocation: boolean,
  refreshUserLocation: () => void,
] => {
  const { userStore } = useStores()
  const [userLocation, setUserLocation] = useState<LatLongCoords>()
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
      translate("createNewGymScreen.locationPermissionRequiredLabel"),
      translate("createNewGymScreen.locationPermissionRequiredMessage"),
      [
        {
          text: translate("common.ok"),
          style: "cancel",
          onPress: () => {
            console.debug("alert cancel pressed")
            refreshUserLocation()
          },
        },
      ],
    )
  }, [permissionAlertRefreshKey])

  useEffect(() => {
    const getUserLocation = async () => {
      setUserLocation(null)
      setIsGettingUserLocation(true)
      try {
        const location = await userStore.getUserLocation()
        console.debug("useUserLocation [getUserLocationRefreshKey] location:", location)
        if (!location) {
          showPermissionAlert()
          return
        }
        setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude })
      } catch (e) {
        console.error("useUserLocation [getUserLocationRefreshKey] error:", e)
      }
      setIsGettingUserLocation(false)
    }

    getUserLocation()
  }, [getUserLocationRefreshKey])

  return [userLocation, isGettingUserLocation, refreshUserLocation]
}
