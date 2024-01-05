import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { Gym } from "app/data/model"
import { useUserLocation } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import Toast from "react-native-root-toast"
import { Screen, Text } from "../../components"
import { GymPicker } from "../Gym"

export const WorkoutGymPickerScreen: FC = observer(() => {
  const { workoutStore, gymStore } = useStores()
  const mainNavigation = useMainNavigation()
  const { userLocation, isGettingUserLocation, refreshUserLocation } = useUserLocation()
  const [userSelectedGym, setUserSelectedGym] = useState<Gym>(undefined)

  useEffect(() => {
    const confirmGymSelectionIfClose = async (gym: Gym) => {
      if (isGettingUserLocation) {
        Toast.show(translate("gymPickerScreen.gettingUserLocationLabel"), {
          duration: Toast.durations.SHORT,
        })
        return
      }

      if (userLocation) {
        gymStore
          .getDistanceToGym(gym.gymId, userLocation)
          .then((distanceToGym) => {
            if (distanceToGym > GYM_PROXIMITY_THRESHOLD_METERS) {
              Toast.show(translate("gymPickerScreen.locationTooFarMessage"), {
                duration: Toast.durations.SHORT,
              })
            } else {
              workoutStore.setGym(gym)
              mainNavigation.goBack()
            }
          })
          .catch((e) => {
            console.error("GymPickerScreen.isNearGym error:", e)
          })
      } else {
        console.debug("GymPickerScreen.setWorkoutGym: user location is unavailable, refreshing")
        refreshUserLocation()
      }
    }

    if (userSelectedGym) confirmGymSelectionIfClose(userSelectedGym)
  }, [userLocation, isGettingUserLocation, userSelectedGym])

  return (
    <Screen safeAreaEdges={["top", "bottom"]} preset="fixed" contentContainerStyle={$container}>
      <Text tx="activeWorkoutScreen.gymPickerScreenTitle" preset="heading" />
      <GymPicker
        onGymSelected={(gym) => {
          refreshUserLocation()
          setUserSelectedGym(gym)
        }}
      />
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}
