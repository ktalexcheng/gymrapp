import { Button, Icon, RowView, Screen, Spacer, Text, TextField } from "app/components"
import { AppLocale } from "app/data/constants"
import { useUserLocation } from "app/hooks"
import { MainStackScreenProps } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { GoogleMapsPlacePrediction, api } from "app/services/api"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { logError } from "app/utils/logger"
import React, { useEffect, useState } from "react"
import { View, ViewStyle } from "react-native"

interface CreateNewGymScreenProps extends MainStackScreenProps<"CreateNewGym"> {}

export const CreateNewGymScreen = ({ route }: CreateNewGymScreenProps) => {
  const { themeStore, gymStore, userStore } = useStores()
  const mainNavigator = useMainNavigation()
  const { userLocation, isGettingUserLocation, refreshUserLocation } = useUserLocation()
  const [searchInput, setSearchInput] = useState<string>()
  const [gymName, setGymName] = useState<string>()
  const [gymAddress, setGymAddress] = useState<string>()
  const [gymPlaceId, setGymPlaceId] = useState<string>()
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictedPlaces, setPredictedPlaces] = useState<GoogleMapsPlacePrediction[]>()
  const [isCreatingGym, setIsCreatingGym] = useState(false)
  const userAppLocale = userStore.getUserPreference<AppLocale>("appLocale")

  const isReadyForSubmission = !!gymName && !!gymAddress && !!gymPlaceId

  useEffect(() => {
    refreshUserLocation()
    if (route?.params?.searchString) {
      setSearchInput(route.params.searchString)
    }
  }, [])

  useEffect(() => {
    // Abort if user location is unavailable yet
    if (!userLocation || isGettingUserLocation) return undefined

    // Reset state as soon as the user starts typing again (gymName changes)
    // setPredictedPlaces(undefined) is the initial state, if the predicted result is empty
    // it will be set to an empty array instead
    setIsPredicting(false)
    setPredictedPlaces(undefined)

    // Abort if search string is empty
    if (!searchInput) return undefined

    const getPredictionsTimeout = setTimeout(() => {
      setIsPredicting(true)
      api
        .getPlacePredictions(searchInput, userAppLocale, userLocation)
        .then((results) => {
          setPredictedPlaces(results)
          setIsPredicting(false)
        })
        .catch((e) => logError(e, "error encountered when searching users:"))
    }, 500) // Only runs after delay

    return () => clearTimeout(getPredictionsTimeout)
  }, [searchInput, userLocation, isGettingUserLocation])

  const selectGymFromPrediction = (place: GoogleMapsPlacePrediction) => {
    setGymName(place.structured_formatting.main_text)
    setGymAddress(place.structured_formatting.secondary_text)
    setGymPlaceId(place.place_id)
  }

  const renderPredictedPlaces = () => {
    if (isGettingUserLocation) {
      return <Text tx="userLocation.gettingUserLocationLabel" preset="formHelper" />
    }

    if (isPredicting) {
      return <Text tx="createNewGymScreen.checkingGymExistsLabel" preset="formHelper" />
    }

    if (predictedPlaces && predictedPlaces.length === 0) {
      return <Text preset="formHelper" tx="createNewGymScreen.noGymsFoundLabel" />
    }

    if (predictedPlaces && predictedPlaces.length > 0) {
      return (
        <>
          {predictedPlaces.map((place) => (
            <Button
              key={place.place_id}
              preset="text"
              text={place.structured_formatting.main_text}
              numberOfLines={2}
              onPress={() => selectGymFromPrediction(place)}
            />
          ))}
        </>
      )
    }

    return null
  }

  const handleClearSelection = () => {
    setGymName(undefined)
    setGymAddress(undefined)
    setGymPlaceId(undefined)
  }

  const handleCreateNewGym = () => {
    if (gymPlaceId) {
      setIsCreatingGym(true)
      gymStore
        .createNewGym(gymPlaceId)
        .then(() => {
          setIsCreatingGym(false)
          mainNavigator.replace("GymDetails", { gymId: gymPlaceId })
        })
        .catch((e) => {
          logError(e, "CreateNewGymScreen.handleCreateNewGym error")
          setIsCreatingGym(false)
        })
    }
  }

  const $readOnlySection: ViewStyle = {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeStore.colors("border"),
    padding: spacing.small,
    gap: spacing.small,
  }

  return (
    <Screen
      preset="auto"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={styles.screenContainer}
      isBusy={isCreatingGym}
    >
      <RowView style={styles.justifyBetween}>
        <Button preset="text" tx="common.cancel" onPress={() => mainNavigator.goBack()} />
        <Button
          disabled={!isReadyForSubmission}
          preset="text"
          tx="createNewGymScreen.createNewGymButtonLabel"
          onPress={handleCreateNewGym}
        />
      </RowView>
      <Text tx="createNewGymScreen.createNewGymTitle" preset="heading" />
      <Text tx="createNewGymScreen.howToCreateANewGymMessage" />
      <Spacer type="vertical" size="small" />

      {isReadyForSubmission && (
        <>
          <View style={$readOnlySection}>
            <TextField
              status="disabled"
              labelTx="createNewGymScreen.gymNameLabel"
              placeholderTx="createNewGymScreen.gymNamePlaceholder"
              multiline={true}
              value={gymName}
              RightAccessory={() => !!gymName && <Icon name="checkmark-circle" size={24} />}
            />
            <TextField
              status="disabled"
              labelTx="createNewGymScreen.gymLocationLabel"
              placeholderTx="createNewGymScreen.gymLocationPlaceholder"
              multiline={true}
              value={gymAddress}
              // onChangeText={handleManualGymAddressChange}
              RightAccessory={() => !!gymAddress && <Icon name="checkmark-circle" size={24} />}
            />
          </View>
          <RowView style={styles.justifyFlexEnd}>
            <Button tx="common.clear" preset="text" onPress={handleClearSelection} />
          </RowView>
        </>
      )}

      <Text preset="subheading" tx="createNewGymScreen.searchLabel" />
      <Spacer type="vertical" size="small" />
      <TextField
        placeholderTx="createNewGymScreen.searchPlaceholder"
        value={searchInput}
        onChangeText={setSearchInput}
        RightAccessory={(props) => (
          <Icon
            name="close-circle-outline"
            size={24}
            onPress={() => setSearchInput(undefined)}
            {...props}
          />
        )}
      />
      <Spacer type="vertical" size="small" />
      {renderPredictedPlaces()}
    </Screen>
  )
}
