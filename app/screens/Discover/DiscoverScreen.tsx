import { Button, ButtonProps, RowView, Screen, Spacer, Text } from "app/components"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { GymSearch } from "./GymSearch"
import { UserSearch } from "./UserSearch"

interface CategoryButtonProps extends ButtonProps {
  selected?: boolean
}

const CategoryButton: FC<CategoryButtonProps> = (props: CategoryButtonProps) => {
  const { themeStore } = useStores()

  const $buttonView: ViewStyle = {
    minHeight: 0,
    borderRadius: 40,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    backgroundColor: props.selected
      ? themeStore.colors("actionable")
      : themeStore.colors("disabledBackground"),
  }

  const $text: TextStyle = {
    color: props.selected ? themeStore.colors("actionableForeground") : themeStore.colors("text"),
  }

  return <Button {...props} style={$buttonView} textStyle={$text} preset="filled" />
}

export enum SearchCategory {
  // All = "all",
  Users = "users",
  Gyms = "gyms",
}

export const DiscoverScreen = observer(() => {
  const { workoutStore } = useStores()
  const [searchCategory, setSearchCategory] = useState<SearchCategory>(SearchCategory.Users)
  const safeAreaEdges: ExtendedEdge[] = workoutStore.inProgress ? [] : ["top"]

  return (
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={styles.screenContainer}>
      <Text tx="discoverScreen.discoverTitle" preset="screenTitle" />
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
      <View style={styles.flex1}>
        {searchCategory === SearchCategory.Users ? (
          <UserSearch />
        ) : searchCategory === SearchCategory.Gyms ? (
          <GymSearch />
        ) : null}
      </View>
    </Screen>
  )
})

const $buttonGroup: ViewStyle = {
  gap: spacing.small,
}
