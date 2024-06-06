import { Text } from "app/components"
import { GoogleMapsPlacePrediction } from "app/services"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React from "react"
import { TouchableOpacity } from "react-native"

export type PredictedPlacesItemProps = {
  place: GoogleMapsPlacePrediction
  onPress: () => void
}

export const PredictedPlacesItem = observer(function PredictedPlacesItem(
  props: PredictedPlacesItemProps,
) {
  const { place, onPress } = props

  const { themeStore } = useStores()

  return (
    <TouchableOpacity onPress={onPress} style={themeStore.styles("listItemContainer")}>
      <Text weight="bold" text={place.structured_formatting.main_text} />
      <Text text={place.structured_formatting.secondary_text} />
    </TouchableOpacity>
  )
})
