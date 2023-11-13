import { Screen, Search } from "app/components"
import { spacing } from "app/theme"
import React from "react"
import { ViewStyle } from "react-native"
import { SearchCategory, SearchComponents } from "../Discover"

export const GymSearchScreen = () => {
  return (
    <Screen safeAreaEdges={["bottom"]} style={$container}>
      <Search
        searchBarPlaceholderTx={SearchComponents[SearchCategory.Gyms].searchBarPlaceholderTx}
        searchCallback={SearchComponents[SearchCategory.Gyms].searchCallback}
        renderSearchResultItem={SearchComponents[SearchCategory.Gyms].renderSearchResultItem}
        searchResultItemKeyField={SearchComponents[SearchCategory.Gyms].searchResultItemKeyField}
        footerComponent={SearchComponents[SearchCategory.Gyms].footerComponent}
      />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}
