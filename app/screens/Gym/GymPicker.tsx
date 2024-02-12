import { Gym } from "app/data/types"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { View, ViewStyle } from "react-native"
import { Accordion } from "tamagui"
import { Button, Icon, RowView, Spacer, Text } from "../../components"
import { GymSearch } from "../Discover"

interface GymPickerProps {
  onGymSelected: (gym: Gym) => void
}

export const GymPicker: FC<GymPickerProps> = observer((props: GymPickerProps) => {
  const { onGymSelected } = props
  const { userStore } = useStores()
  const [myGyms, setMyGyms] = useState<Gym[]>()

  useEffect(() => {
    if (!userStore.isLoadingProfile) {
      const _myGyms = userStore.getProp<Gym[]>("user.myGyms")
      if (_myGyms) {
        setMyGyms(_myGyms)
      }
    }
  }, [userStore.user])

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
              numberOfLines={1}
              onPress={() => onGymSelected(gym)}
            />
          )
        })}
      </>
    )
  }

  return (
    <View>
      <Spacer type="vertical" size="medium" />
      <Accordion type="single" defaultValue="myGyms">
        <Accordion.Item value="myGyms">
          <Accordion.Trigger flexDirection="row" justifyContent="space-between" unstyled>
            {({ open }) => (
              <RowView style={[styles.alignCenter, styles.justifyBetween]}>
                <Text tx="gymPickerScreen.selectFromMyGymsLabel" preset="subheading" />
                <Icon name={open ? "chevron-up" : "chevron-down"} size={24} />
              </RowView>
            )}
          </Accordion.Trigger>
          <Accordion.Content unstyled>
            <View style={$myGymsContainer}>{renderMyGymsItem()}</View>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="searchGyms">
          <Accordion.Trigger flexDirection="row" justifyContent="space-between" unstyled>
            {({ open }) => (
              <RowView style={[styles.alignCenter, styles.justifyBetween]}>
                <Text tx="gymPickerScreen.searchForGymLabel" preset="subheading" />
                <Icon name={open ? "chevron-up" : "chevron-down"} size={24} />
              </RowView>
            )}
          </Accordion.Trigger>
          <Accordion.Content unstyled style={$gymSearchContainer}>
            <GymSearch />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  )
})

const $myGymsContainer: ViewStyle = {
  maxHeight: 200,
}

const $gymSearchContainer: ViewStyle = {
  height: "90%",
}
