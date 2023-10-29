import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { Gym } from "app/data/model"
import { useUserLocation } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { RefreshControl, View, ViewStyle } from "react-native"
import Toast from "react-native-root-toast"
import { Button, Screen, Text } from "../../components"
import { GymSearchBar } from "../Gym/GymSearchBar"

export const GymPickerScreen: FC = () => {
  const { userStore, workoutStore, gymStore } = useStores()
  const [myGyms, setMyGyms] = useState<Gym[]>()
  const [userLocation, isGettingUserLocation] = useUserLocation()
  const mainNavigation = useMainNavigation()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setIsRefreshing(true)
    if (!userStore.isLoadingProfile) {
      const _myGyms = userStore.getProp<Gym[]>("user.myGyms")
      if (_myGyms) {
        setMyGyms(_myGyms)
      }
    }
    setIsRefreshing(false)
  }, [userStore.user, refreshKey])

  const setWorkoutGym = (gym: Gym) => {
    if (isGettingUserLocation) {
      Toast.show(translate("gymPickerScreen.gettingUserLocationLabel"), {
        duration: Toast.durations.SHORT,
      })
      return
    }

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
  }

  const renderMyGymsItem = () => {
    if (!myGyms?.length) {
      return <Text tx="gymPickerScreen.emptyMyGymsLabel" preset="formHelper" />
    }

    return (
      <>
        {myGyms.map((gym) => {
          return (
            <Button
              key={gym.gymId}
              preset="text"
              text={gym.gymName}
              onPress={() => {
                setWorkoutGym(gym)
              }}
            />
          )
        })}
      </>
    )
  }

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      preset="scroll"
      ScrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
          />
        ),
      }}
      style={$container}
    >
      <Text tx="gymPickerScreen.gymPickerTitle" preset="heading" />
      <Text tx="gymPickerScreen.selectFromMyGymsLabel" preset="subheading" />
      <View style={$myGymsContainer}>{renderMyGymsItem()}</View>
      <Text tx="gymPickerScreen.searchForGymLabel" preset="subheading" />
      <View style={styles.flex1}>
        <GymSearchBar onPressResultItemCallback={(gym) => () => setWorkoutGym(gym)} />
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.screenPadding,
}

const $myGymsContainer: ViewStyle = {
  maxHeight: 200,
}
