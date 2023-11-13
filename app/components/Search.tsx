import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { FlatList, ListRenderItem, View, ViewProps } from "react-native"
import { Spacer } from "./Spacer"
import { Text } from "./Text"
import { TextField } from "./TextField"

export interface SearchProps extends ViewProps {
  searchBarPlaceholderTx?: TxKeyPath
  isSearchingMessageTx?: TxKeyPath
  emptyResultsMessageTx?: TxKeyPath
  searchTextTooShortMessageTx?: TxKeyPath
  minimumSearchTextLength?: number
  searchCallback: (searchText: string) => Promise<any[]>
  renderSearchResultItem: ListRenderItem<any>
  searchResultItemKeyField: string
  emptyResultsComponent?: React.ReactNode
  footerComponent?: React.ReactNode
}

export const Search: FC<SearchProps> = ({
  searchBarPlaceholderTx = "common.search.inputPlaceholder",
  isSearchingMessageTx = "common.search.isSearchingMessage",
  emptyResultsMessageTx = "common.search.noResultsFoundMessage",
  searchTextTooShortMessageTx = "common.search.moreCharactersRequiredMessage",
  minimumSearchTextLength = 3,
  searchCallback,
  renderSearchResultItem,
  searchResultItemKeyField,
  emptyResultsComponent,
  footerComponent,
}: SearchProps) => {
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any[]>([])

  useEffect(() => {
    setSearchText("")
    setIsSearching(false)
    setSearchResult([])
  }, [searchCallback, renderSearchResultItem, searchResultItemKeyField])

  useEffect(() => {
    if (!searchText) return undefined

    setIsSearching(true)
    const searchTimeout = setTimeout(() => {
      searchCallback(searchText)
        .then((results) => {
          setSearchResult(results)
          setIsSearching(false)
        })
        .catch((e) => {
          console.error("Search.useEffect searchCallback error:", e)
        })
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [searchText])

  const renderSearchResults = () => {
    if (!searchText) return undefined
    if (searchText.length < minimumSearchTextLength) {
      return <Text tx={searchTextTooShortMessageTx} style={styles.textAlignCenter} />
    }
    if (isSearching) {
      return <Text tx={isSearchingMessageTx} style={styles.textAlignCenter} />
    }
    if (!searchResult.length) {
      return (
        <>
          <Text tx={emptyResultsMessageTx} style={styles.textAlignCenter} />
          {emptyResultsComponent}
        </>
      )
    }

    return (
      <>
        <FlatList
          data={searchResult}
          renderItem={renderSearchResultItem}
          keyExtractor={(item) => item[searchResultItemKeyField]}
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListFooterComponent={
            <Text
              tx="common.search.notWhatYouAreLookingForMessage"
              style={styles.textAlignCenter}
            />
          }
        />
      </>
    )
  }

  const renderFooter = () => {
    if (searchText.length >= minimumSearchTextLength && !isSearching && footerComponent) {
      return footerComponent
    } else {
      return undefined
    }
  }

  return (
    <View>
      <TextField
        placeholderTx={searchBarPlaceholderTx}
        value={searchText}
        onChangeText={setSearchText}
      />
      {renderSearchResults()}
      {renderFooter()}
    </View>
  )
}
