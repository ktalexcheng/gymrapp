import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { Gym } from "app/data/types"
import { useToast } from "app/hooks"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { getUserLocation } from "app/utils/getUserLocation"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
import { Screen, Text } from "../../components"
import { GymPicker } from "../Gym"

export const WorkoutGymPickerScreen: FC = observer(() => {
  const { workoutStore, gymStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [toastShowTx] = useToast()
  const [isBusy, setIsBusy] = useState(false)

  async function checkProximityAndSetGym(gym: Gym) {
    setIsBusy(true)

    try {
      const userLocation = await getUserLocation()
      console.debug("checkProximityAndSetGym", { userLocation })
      if (!userLocation || !userLocation.location) {
        toastShowTx("userLocation.unableToAcquireLocationMessage")
        return
      }

      const distanceToGym = await gymStore.getDistanceToGym(gym.gymId, userLocation.location)
      console.debug("checkProximityAndSetGym", { distanceToGym })
      if (distanceToGym > GYM_PROXIMITY_THRESHOLD_METERS) {
        toastShowTx("gymPickerScreen.locationTooFarMessage")
      } else {
        workoutStore.setGym(gym)
        mainNavigation.goBack()
      }
    } catch (e) {
      console.error("ActiveWorkoutScreen.checkProximityAndSetGym error:", e)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      preset="fixed"
      contentContainerStyle={$container}
      isBusy={isBusy}
    >
      <Text tx="activeWorkoutScreen.gymPickerScreenTitle" preset="heading" />
      <GymPicker
        onGymSelected={(gym) => {
          checkProximityAndSetGym(gym)
        }}
      />
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}
