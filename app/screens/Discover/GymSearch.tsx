import { Button, Icon, RowView, Search, Spacer, Text } from "app/components"
import { GymSearchResult } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { api } from "app/services/api"
import { spacing, styles } from "app/theme"
import { simplifyNumber } from "app/utils/formatNumber"
import React, { FC } from "react"
import { View, ViewStyle } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"

interface GymSearchResultItemProps {
  gym: GymSearchResult
}

const GymSearchResultItem: FC<GymSearchResultItemProps> = ({ gym }: GymSearchResultItemProps) => {
  const mainNavigator = useMainNavigation()

  console.debug("GymSearchResultItem gym:", gym)
  return (
    <TouchableOpacity onPress={() => mainNavigator.navigate("GymDetails", { gymId: gym.gymId })}>
      <RowView style={$gymResultItemContainer}>
        <View style={styles.alignCenter}>
          <Icon name="business" size={36} />
          <Spacer type="vertical" size="tiny" />
          <RowView style={[styles.alignCenter, styles.justifyCenter]}>
            {/* <Icon name="barbell" size={16} />
            <Spacer type="horizontal" size="tiny" />
            <Text size="xxs">{simplifyNumber(gym.gymWorkoutsCount ?? 0)}</Text>
            <Spacer type="horizontal" size="tiny" /> */}
            <Icon name="people" size={16} />
            <Spacer type="horizontal" size="tiny" />
            <Text size="xxs">{simplifyNumber(gym.gymMembersCount ?? 0)}</Text>
          </RowView>
        </View>
        <Spacer type="horizontal" size="small" />
        <View style={styles.flex1}>
          <Text text={gym.gymName} numberOfLines={2} />
        </View>
      </RowView>
    </TouchableOpacity>
  )
}

const GymSearchFooterComponent: FC = () => {
  const mainNavigator = useMainNavigation()

  return (
    <>
      <Button
        tx="gymSearch.createNewGymButtonLabel"
        preset="text"
        style={styles.alignCenter}
        onPress={() => mainNavigator.navigate("CreateNewGym")}
      />
      <Spacer type="vertical" size="extraLarge" />
    </>
  )
}

const GymSearchPromptComponent = () => {
  return (
    <View style={styles.centeredContainer}>
      <Text tx="gymSearch.searchPromptMessage" />
    </View>
  )
}

export const GymSearch: FC = () => {
  const searchCallback = (searchText: string) => {
    return api.searchGyms(searchText)
  }

  const renderGymResultItem = ({ item }: { item: GymSearchResult }) => (
    <GymSearchResultItem gym={item} />
  )

  return (
    <Search
      searchPromptComponent={GymSearchPromptComponent}
      searchBarPlaceholderTx="gymSearch.searchBarPlaceholder"
      searchCallback={searchCallback}
      renderSearchResultItem={renderGymResultItem}
      searchResultItemKeyField={"gymId"}
      footerComponent={GymSearchFooterComponent}
    />
  )
}

const $gymResultItemContainer: ViewStyle = {
  paddingVertical: spacing.small,
  alignItems: "center",
}
