import { Avatar, RowView, Search, Spacer, Text } from "app/components"
import { UserSearchResult } from "app/data/types"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { api } from "app/services/api"
import { spacing, styles } from "app/theme"
import { formatName } from "app/utils/formatName"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

interface UserSearchResultItemProps {
  user: UserSearchResult
}

const UserSearchResultItem: FC<UserSearchResultItemProps> = ({
  user,
}: UserSearchResultItemProps) => {
  const mainNavigator = useMainNavigation()

  return (
    <TouchableOpacity
      onPress={() => mainNavigator.navigate("ProfileVisitorView", { userId: user.userId })}
    >
      <RowView style={$userResultItemContainer}>
        <Avatar user={user} size="sm" />
        <Spacer type="horizontal" size="small" />
        <View>
          <Text weight="bold" text={user.userHandle} />
          <Text text={formatName(user.firstName, user.lastName)} />
        </View>
      </RowView>
    </TouchableOpacity>
  )
}

// const UserSearchFooterComponent = () => {
//   return (
//     <>
//       <Button
//         tx="userSearch.inviteFriendsButtonLabel"
//         preset="text"
//         style={styles.alignCenter}
//         onPress={() => console.debug("TODO: share download link to friends")}
//       />
//       <Spacer type="vertical" size="extraLarge" />
//     </>
//   )
// }

const UserSearchPromptComponent = () => {
  return (
    <View style={styles.centeredContainer}>
      <Text tx="userSearch.searchPromptMessage" />
    </View>
  )
}

export const UserSearch: FC = () => {
  const searchCallback = (searchText: string) => {
    return api.searchUsers(searchText)
  }

  const renderSearchResultItem = ({ item }: { item: UserSearchResult }) => (
    <UserSearchResultItem user={item} />
  )

  return (
    <Search
      searchPromptComponent={UserSearchPromptComponent}
      searchBarPlaceholderTx={"userSearch.searchBarPlaceholder"}
      searchCallback={searchCallback}
      renderSearchResultItem={renderSearchResultItem}
      searchResultItemKeyField="userId"
      showEndOfListMessage={false}
      // footerComponent={UserSearchFooterComponent}
    />
  )
}

const $userResultItemContainer: ViewStyle = {
  paddingVertical: spacing.small,
  alignItems: "center",
}
