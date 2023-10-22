import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Icon, RowView, Screen, Spacer, Text } from "app/components"
import { GymDetails } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { RefreshControl, ViewStyle } from "react-native"

type GymDetailsScreenProps = NativeStackScreenProps<MainStackParamList, "GymDetails">

export const GymDetailsScreen: FC = observer(({ route }: GymDetailsScreenProps) => {
  const gymId = route.params.gymId
  const { gymStore, userStore } = useStores()
  const [gymDetails, setGymDetails] = useState<GymDetails>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshGymDetailsKey, setRefreshGymDetailsKey] = useState(0)

  useEffect(() => {
    gymStore
      .getGymById(gymId)
      .then((gym) => {
        setGymDetails(gym)
        setIsRefreshing(false)
      })
      .catch((e) => {
        console.error("GymDetailsScreen.useEffect getGymById error:", e)
        setIsRefreshing(false)
      })
  }, [gymId, refreshGymDetailsKey])

  const refreshGymDetails = () => {
    setIsRefreshing(true)
    setRefreshGymDetailsKey((prev) => prev + 1)
  }

  const handleAddToMyGyms = () => {
    userStore
      .addToMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleAddToMyGyms error:", e)
      })
  }

  const handleRemoveFromMyGyms = () => {
    userStore
      .removeFromMyGyms(gymDetails)
      .then(() => refreshGymDetails())
      .catch((e) => {
        console.error("GymDetailsScreen.handleRemoveFromMyGyms error:", e)
      })
  }

  const renderAddRemoveButton = () => {
    if (userStore.isInMyGyms(gymId)) {
      return (
        <Button
          tx="gymDetailsScreen.removeFromMyGymsLabel"
          onPress={handleRemoveFromMyGyms}
          preset="text"
        />
      )
    }

    return (
      <Button tx="gymDetailsScreen.addToMyGymsLabel" onPress={handleAddToMyGyms} preset="text" />
    )
  }

  if (!gymDetails) return null

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      style={$container}
      preset="scroll"
      ScrollViewProps={{
        refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={refreshGymDetails} />,
      }}
    >
      <Text text={gymDetails.gymName} preset="heading" />
      <Spacer type="vertical" size="tiny" />
      <Text text={gymDetails.googleMapsPlaceDetails?.formatted_address} />
      <Spacer type="vertical" size="tiny" />
      <RowView style={$gymStatusBar}>
        <RowView style={styles.alignCenter}>
          <Icon name="people" size={16} />
          <Spacer type="horizontal" size="micro" />
          <Text>{gymDetails.gymMembersCount ?? "-"}</Text>
        </RowView>
        {renderAddRemoveButton()}
      </RowView>
      <Spacer type="vertical" size="large" />
      <Text tx="common.leaderboard" preset="subheading" />
    </Screen>
  )
})

const $container: ViewStyle = {
  padding: spacing.screenPadding,
}

const $gymStatusBar: ViewStyle = {
  justifyContent: "space-between",
}
