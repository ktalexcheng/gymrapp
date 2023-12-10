import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Screen, Spacer, Text, TextField } from "app/components"
import { AppLocale } from "app/data/constants"
import { useUserLocation } from "app/hooks"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { GoogleMapsPlacePrediction, api } from "app/services/api"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { LoadingScreen } from "../LoadingScreen"

type CreateNewGymScreenProps = NativeStackScreenProps<MainStackParamList, "CreateNewGym">

export const CreateNewGymScreen: FC = ({ route }: CreateNewGymScreenProps) => {
  const { gymStore, userStore } = useStores()
  const mainNavigator = useMainNavigation()
  const [userLocation, isGettingUserLocation, refreshUserLocation] = useUserLocation()
  const [gymName, setGymName] = useState("")
  const [gymAddress, setGymAddress] = useState("")
  const [gymPlaceId, setGymPlaceId] = useState(null)
  const [isAutofilled, setIsAutofilled] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictedPlaces, setPredictedPlaces] = useState<GoogleMapsPlacePrediction[]>(null)
  const [isCreatingGym, setIsCreatingGym] = useState(false)
  const userAppLocale = userStore.getUserPreference<AppLocale>("appLocale")

  useEffect(() => {
    refreshUserLocation()
    if (route?.params?.searchString) {
      setGymName(route.params.searchString)
    }
  }, [])

  useEffect(() => {
    // Abort if user location is unavailable yet
    if (!userLocation || isGettingUserLocation) return undefined

    // Abort if fields are auto-populated by user selection from predicted places
    if (isAutofilled) return undefined

    // Reset state as soon as the user starts typing again (gymName changes)
    // setPredictedPlaces(null) is the initial state, if the predicted result is empty
    // it will be set to an empty array instead
    setIsPredicting(false)
    setPredictedPlaces(null)

    // Abort if gym name is empty
    if (!gymName) return undefined

    const getPredictionsTimeout = setTimeout(() => {
      setIsPredicting(true)
      api
        .getPlacePredictions(gymName, userAppLocale, userLocation)
        .then((results) => {
          setPredictedPlaces(results)
          setIsPredicting(false)
        })
        .catch((e) => console.error("error encountered when searching users:", e))
    }, 500) // Only runs after delay

    return () => clearTimeout(getPredictionsTimeout)
  }, [gymName, userLocation, isGettingUserLocation])

  const selectGymFromPrediction = (place: GoogleMapsPlacePrediction) => {
    setIsAutofilled(true)
    setGymName(place.structured_formatting.main_text)
    setGymAddress(place.structured_formatting.secondary_text)
    setGymPlaceId(place.place_id)
  }

  const renderPredictedPlaces = () => {
    if (isGettingUserLocation) {
      return <Text tx="createNewGymScreen.gettingUserLocationLabel" preset="formHelper" />
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
          <Text preset="subheading" tx="createNewGymScreen.gymsNearYouLabel" />
          {predictedPlaces.map((place) => (
            <Button
              key={place.place_id}
              preset="text"
              text={place.structured_formatting.main_text}
              onPress={() => selectGymFromPrediction(place)}
            />
            // <Text key={place.place_id} text={place.structured_formatting.main_text} />
          ))}
        </>
      )
    }

    return null
  }

  const handleManualGymNameChange = (text: string) => {
    setIsAutofilled(false)
    setGymName(text)
  }

  const handleManualGymAddressChange = (text: string) => {
    setIsAutofilled(false)
    setGymAddress(text)
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
          console.error("CreateNewGymScreen.handleCreateNewGym error:", e)
          setIsCreatingGym(false)
        })
    }
  }

  if (isCreatingGym) {
    return <LoadingScreen />
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <Text tx="createNewGymScreen.createNewGymTitle" preset="heading" />
      <TextField
        labelTx="createNewGymScreen.gymNameLabel"
        placeholderTx="createNewGymScreen.gymNamePlaceholder"
        containerStyle={styles.formFieldTopMargin}
        value={gymName}
        onChangeText={handleManualGymNameChange}
      />
      <TextField
        labelTx="createNewGymScreen.gymLocationLabel"
        placeholderTx="createNewGymScreen.gymLocationPlaceholder"
        containerStyle={styles.formFieldTopMargin}
        value={gymAddress}
        onChangeText={handleManualGymAddressChange}
      />
      <Spacer type="vertical" size="large" />
      {renderPredictedPlaces()}
      <Spacer type="vertical" size="large" />
      <Button tx="createNewGymScreen.createNewGymButtonLabel" onPress={handleCreateNewGym} />
    </Screen>
  )
}
