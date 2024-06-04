import { Icon, RowView, Spacer, Text } from "app/components"
import { Gym } from "app/data/types"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { Accordion } from "tamagui"
import { GymSearch } from "./GymSearch"

interface GymPickerProps {
  myGyms: Gym[]
  onPressFavoriteGym: (gym: Gym) => void
  onPressGymSearchResult: (gym: Gym) => void
  MyGymsItemRightAccessory?: React.ComponentType<{ gym: Gym }>
}

export const GymPicker: FC<GymPickerProps> = observer((props: GymPickerProps) => {
  const { themeStore } = useStores()
  const { myGyms, onPressFavoriteGym, onPressGymSearchResult, MyGymsItemRightAccessory } = props

  const renderMyGymsItem = () => {
    if (!myGyms?.length) {
      return <Text tx="gymPickerScreen.emptyMyGymsLabel" preset="formHelper" />
    }

    return (
      <>
        {myGyms.map((gym) => {
          return (
            <RowView key={gym.gymId} style={$myGymItem}>
              <TouchableOpacity style={styles.flex1} onPress={() => onPressFavoriteGym(gym)}>
                <Text
                  text={gym.gymName}
                  numberOfLines={1}
                  textColor={themeStore.colors("actionable")}
                />
              </TouchableOpacity>
              {MyGymsItemRightAccessory && <MyGymsItemRightAccessory gym={gym} />}
            </RowView>
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
            <GymSearch
              myGyms={myGyms}
              onPressGymResultOverride={(gym) => {
                onPressGymSearchResult(gym)
              }}
            />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  )
})

const $myGymsContainer: ViewStyle = {
  // maxHeight: 200,
}

const $gymSearchContainer: ViewStyle = {
  height: "90%",
}

const $myGymItem: ViewStyle = {
  flexDirection: "row",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
