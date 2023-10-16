import { Avatar, Button, Icon, RowView, Spacer, Text, TextField } from "app/components"
import { GymSearchResult } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { FlatList, TouchableOpacity, View, ViewStyle } from "react-native"

export type GymSearchBarProps = {
  onPressResultItemCallback: (gym: GymSearchResult) => () => void
}

export const GymSearchBar: FC<GymSearchBarProps> = (props: GymSearchBarProps) => {
  const { onPressResultItemCallback } = props
  const { gymStore } = useStores()
  const mainNavigator = useMainNavigation()
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [gymSearchResults, setGymSearchResults] = useState<GymSearchResult[]>([])

  useEffect(() => {
    if (!searchText) return undefined

    setIsSearching(true)
    const searchGymTimeout = setTimeout(() => {
      gymStore
        .searchGyms(searchText)
        .then((results) => {
          setGymSearchResults(results)
          setIsSearching(false)
        })
        .catch((e) => {
          console.error("GymSearchBar.useEffect searchGyms error:", e)
        })
    }, 500)

    return () => clearTimeout(searchGymTimeout)
  }, [searchText])

  const handleSearchTextChange = (value: string) => {
    setSearchText(value)
  }

  const renderGymItem = ({ item }: { item: GymSearchResult }) => {
    return (
      <TouchableOpacity onPress={onPressResultItemCallback(item)}>
        <RowView style={$gymItemContainer}>
          <View style={styles.flex4}>
            <RowView style={$gymItemAvatarNameContainer}>
              <Avatar source={{ uri: item.gymIconUrl }} bg={item.gymIconBackgroundColor} />
              <Spacer type="horizontal" size="small" />
              <View style={styles.flex1}>
                <Text text={item.gymName} weight="semiBold" numberOfLines={1} />
                <Text text={item.gymAddress} weight="light" numberOfLines={1} />
              </View>
            </RowView>
          </View>
          <View style={styles.flex1}>
            <RowView style={$gymItemMembersCountContainer}>
              <Icon name="people" size={16} />
              <Spacer type="horizontal" size="micro" />
              <Text size="xs">{item.gymMembersCount}</Text>
            </RowView>
          </View>
        </RowView>
      </TouchableOpacity>
    )
  }

  const renderSearchResults = () => {
    if (!searchText) return null

    if (searchText.length < 3) {
      return (
        <Text
          style={styles.textAlignCenter}
          tx="gymSearchScreen.moreCharactersRequiredLabel"
          preset="formHelper"
        />
      )
    }

    if (isSearching) {
      return (
        <Text
          style={styles.textAlignCenter}
          tx="gymSearchScreen.searchingGymsLabel"
          preset="formHelper"
        />
      )
    }

    return (
      <>
        {gymSearchResults.length > 0 ? (
          <>
            <FlatList
              data={gymSearchResults}
              renderItem={renderGymItem}
              keyExtractor={(item) => item.gymId}
              ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
            />
            <Spacer type="vertical" size="medium" />
            <Text
              style={styles.textAlignCenter}
              tx="gymSearchScreen.notWhatYouAreLookingForLabel"
              preset="formHelper"
            />
          </>
        ) : (
          <Text
            style={styles.textAlignCenter}
            tx="gymSearchScreen.noGymsFoundLabel"
            preset="formHelper"
          />
        )}
        <Button
          style={styles.alignCenter}
          preset="text"
          tx="gymSearchScreen.createNewGymButtonLabel"
          onPress={() => mainNavigator.navigate("CreateNewGym", { searchString: searchText })}
        />
      </>
    )
  }

  return (
    <View>
      <TextField
        placeholderTx="gymSearchScreen.searchBarPlaceholder"
        value={searchText}
        onChangeText={handleSearchTextChange}
      />
      <View style={$searchResultContainer}>{renderSearchResults()}</View>
    </View>
  )
}

const $searchResultContainer: ViewStyle = {
  marginTop: spacing.medium,
}

const $gymItemContainer: ViewStyle = {
  alignItems: "center",
}

const $gymItemAvatarNameContainer: ViewStyle = {
  alignItems: "center",
}

const $gymItemMembersCountContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "flex-end",
}
