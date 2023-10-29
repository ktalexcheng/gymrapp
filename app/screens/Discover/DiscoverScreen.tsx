import { Avatar, Button, ButtonProps, RowView, Screen, Spacer, Text } from "app/components"
import { Search } from "app/components/Search"
import { GymSearchResult, User, UserSearchResult } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { api } from "app/services/api"
import { colors, spacing, styles } from "app/theme"
import React, { FC, useState } from "react"
import { Image, ImageStyle, ViewStyle } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"

interface CategoryButtonProps extends ButtonProps {
  selected?: boolean
}

const CategoryButton: FC<CategoryButtonProps> = (props: CategoryButtonProps) => {
  const $buttonView: ViewStyle = {
    minHeight: 0,
    borderRadius: 40,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    backgroundColor: props.selected ? colors.actionable : colors.disabled,
  }

  return <Button {...props} style={$buttonView} preset="filled" />
}

enum SearchCategory {
  // All = "all",
  Users = "users",
  Gyms = "gyms",
}

export const DiscoverScreen = () => {
  const mainNavigator = useMainNavigation()
  const [searchCategory, setSearchCategory] = useState<SearchCategory>(SearchCategory.Users)

  const renderUserSearchResultItem = ({ item }: { item: UserSearchResult }) => {
    return (
      <TouchableOpacity
        onPress={() => mainNavigator.navigate("ProfileVisitorView", { userId: item.userId })}
      >
        <RowView style={$userResultItemContainer}>
          <Avatar user={item as User} size="md" />
          <Spacer type="horizontal" size="small" />
          <Text text={`${item.firstName} ${item.lastName}`} />
        </RowView>
      </TouchableOpacity>
    )
  }

  const renderGymSearchResultItem = ({ item }: { item: GymSearchResult }) => {
    return (
      <TouchableOpacity onPress={() => mainNavigator.navigate("GymDetails", { gymId: item.gymId })}>
        <RowView style={$gymResultItemContainer}>
          <Image source={{ uri: item.gymIconUrl }} style={$gymIconStyle} />
          <Spacer type="horizontal" size="small" />
          <Text text={item.gymName} />
        </RowView>
      </TouchableOpacity>
    )
  }

  const selectSearchCallback = () => {
    switch (searchCategory) {
      case SearchCategory.Users:
        return async (query) => api.searchUsers(query)
      case SearchCategory.Gyms:
        return async (query) => api.searchGyms(query)
    }
  }

  const selectSearchResultRenderer = () => {
    switch (searchCategory) {
      case SearchCategory.Users:
        return renderUserSearchResultItem
      case SearchCategory.Gyms:
        return renderGymSearchResultItem
    }
  }

  const selectResultKeyField = () => {
    switch (searchCategory) {
      case SearchCategory.Users:
        return "userId"
      case SearchCategory.Gyms:
        return "gymId"
    }
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <Text tx="discoverScreen.discoverTitle" preset="heading" />
      <Spacer type="vertical" size="small" />
      <RowView style={$buttonGroup} scrollable={true}>
        {/* <CategoryButton
          tx="discoverScreen.allCategoriesLabel"
          selected={searchCategory === SearchCategory.All}
          onPress={() => {
            setSearchCategory(SearchCategory.All)
            console.log("TODO: search all categories")
          }}
        /> */}
        <CategoryButton
          tx="discoverScreen.usersCategoryLabel"
          selected={searchCategory === SearchCategory.Users}
          onPress={() => setSearchCategory(SearchCategory.Users)}
        />
        <CategoryButton
          tx="discoverScreen.gymsCategoryLabel"
          selected={searchCategory === SearchCategory.Gyms}
          onPress={() => setSearchCategory(SearchCategory.Gyms)}
        />
      </RowView>
      <Spacer type="vertical" size="small" />
      <Search
        searchCallback={selectSearchCallback()}
        renderSearchResultItem={selectSearchResultRenderer()}
        searchResultItemKeyField={selectResultKeyField()}
      />
    </Screen>
  )
}

const $buttonGroup: ViewStyle = {
  gap: spacing.small,
}

const $userResultItemContainer: ViewStyle = {
  paddingVertical: spacing.small,
  alignItems: "center",
}

const $gymResultItemContainer: ViewStyle = {
  paddingVertical: spacing.small,
  alignItems: "center",
}

const $gymIconStyle: ImageStyle = {
  height: 50,
  width: 50,
}
