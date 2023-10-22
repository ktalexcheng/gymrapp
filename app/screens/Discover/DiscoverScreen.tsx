import { Avatar, Button, ButtonProps, RowView, Screen, Spacer, Text } from "app/components"
import { Search } from "app/components/Search"
import { User, UserSearchResult } from "app/data/model"
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

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={styles.screenContainer}>
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
          onPress={() => {
            setSearchCategory(SearchCategory.Users)
            console.log("TODO: search users")
          }}
        />
        <CategoryButton
          tx="discoverScreen.gymsCategoryLabel"
          selected={searchCategory === SearchCategory.Gyms}
          onPress={() => {
            setSearchCategory(SearchCategory.Gyms)
            console.log("TODO: search gyms")
          }}
        />
      </RowView>
      <Spacer type="vertical" size="small" />
      <Search
        searchCallback={async (query) => api.searchUsers(query)}
        renderSearchResultItem={renderUserSearchResultItem}
        searchResultItemKeyField="userId"
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
