import { Screen, Text } from "app/components"
import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { Gym } from "app/data/types"
import { GymPicker } from "app/features/Gyms"
import { useToast } from "app/hooks"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { getUserLocation } from "app/utils/getUserLocation"
import { logError } from "app/utils/logger"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"

export const WorkoutGymPickerScreen: FC = observer(() => {
  const { activeWorkoutStore, gymStore, userStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [toastShowTx] = useToast()
  const [isBusy, setIsBusy] = useState(false)

  const myGyms = userStore.getPropAsJS<Gym[]>("user.myGyms")

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
        activeWorkoutStore.setGym(gym)
        mainNavigation.goBack()
      }
    } catch (e) {
      logError(e, "ActiveWorkoutScreen.checkProximityAndSetGym error")
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
        myGyms={myGyms}
        onPressFavoriteGym={(gym) => checkProximityAndSetGym(gym)}
        onPressGymSearchResult={(gym) => checkProximityAndSetGym(gym)}
      />
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}
