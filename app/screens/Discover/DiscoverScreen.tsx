import {
  Avatar,
  Button,
  ButtonProps,
  RowView,
  Screen,
  Search,
  SearchProps,
  Spacer,
  Text,
} from "app/components"
import { GymSearchResult, User, UserSearchResult } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { api } from "app/services/api"
import { colors, spacing, styles } from "app/theme"
import React, { FC, useState } from "react"
import { ViewStyle } from "react-native"
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

export enum SearchCategory {
  // All = "all",
  Users = "users",
  Gyms = "gyms",
}

interface ISearchComponents {
  [key: string]: SearchProps
}

const UserSearchResultItem = ({ user }: { user: UserSearchResult }) => {
  const mainNavigator = useMainNavigation()

  return (
    <TouchableOpacity
      onPress={() => mainNavigator.navigate("ProfileVisitorView", { userId: user.userId })}
    >
      <RowView style={$userResultItemContainer}>
        <Avatar user={user as User} size="sm" />
        <Spacer type="horizontal" size="small" />
        <Text text={`${user.firstName} ${user.lastName}`} />
      </RowView>
    </TouchableOpacity>
  )
}

const GymSearchResultItem = ({ gym }: { gym: GymSearchResult }) => {
  const mainNavigator = useMainNavigation()

  return (
    <TouchableOpacity onPress={() => mainNavigator.navigate("GymDetails", { gymId: gym.gymId })}>
      <RowView style={$gymResultItemContainer}>
        <Avatar source={{ uri: gym.gymIconUrl }} size="md" />
        <Spacer type="horizontal" size="small" />
        <Text text={gym.gymName} />
      </RowView>
    </TouchableOpacity>
  )
}

export const SearchComponents: ISearchComponents = {
  [SearchCategory.Users]: {
    searchBarPlaceholderTx: "userSearch.searchBarPlaceholder",
    searchCallback: (query) => api.searchUsers(query),
    renderSearchResultItem: ({ item }: { item: UserSearchResult }) => (
      <UserSearchResultItem user={item} />
    ),
    searchResultItemKeyField: "userId",
    footerComponent: (
      <Button
        tx="userSearch.inviteFriendsButtonLabel"
        preset="text"
        style={styles.alignCenter}
        onPress={() => console.debug("TODO: send invite to emails")}
      />
    ),
  },
  [SearchCategory.Gyms]: {
    searchBarPlaceholderTx: "gymSearch.searchBarPlaceholder",
    searchCallback: (query) => api.searchGyms(query),
    renderSearchResultItem: ({ item }: { item: GymSearchResult }) => (
      <GymSearchResultItem gym={item} />
    ),
    searchResultItemKeyField: "gymId",
    footerComponent: (
      <Button
        tx="gymSearch.createNewGymButtonLabel"
        preset="text"
        style={styles.alignCenter}
        onPress={() => console.debug("TODO: create a new gym")}
      />
    ),
  },
}

export const DiscoverScreen = () => {
  const [searchCategory, setSearchCategory] = useState<SearchCategory>(SearchCategory.Users)

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
        searchBarPlaceholderTx={SearchComponents[searchCategory].searchBarPlaceholderTx}
        searchCallback={SearchComponents[searchCategory].searchCallback}
        renderSearchResultItem={SearchComponents[searchCategory].renderSearchResultItem}
        searchResultItemKeyField={SearchComponents[searchCategory].searchResultItemKeyField}
        footerComponent={SearchComponents[searchCategory].footerComponent}
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
