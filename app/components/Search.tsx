import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import { logError } from "app/utils/logger"
import React, { FC, useEffect, useState } from "react"
import { FlatList, ListRenderItem, ViewProps } from "react-native"
import { LoadingIndicator } from "./LoadingIndicator"
import { Spacer } from "./Spacer"
import { Text } from "./Text"
import { TextField } from "./TextField"

export interface SearchProps extends ViewProps {
  searchCallback: (searchText: string) => Promise<any[]>
  renderSearchResultItem: ListRenderItem<any>
  searchResultItemKeyField: string
  searchBarPlaceholderTx?: TxKeyPath
  isSearchingMessageTx?: TxKeyPath
  emptyResultsMessageTx?: TxKeyPath
  searchTextTooShortMessageTx?: TxKeyPath
  showEndOfListMessage?: boolean
  endOfListMessageTx?: TxKeyPath
  minimumSearchTextLength?: number
  showInitialSuggestions?: boolean
  searchPromptComponent?: React.ComponentType<any> | React.ReactElement | null | undefined
  emptyResultsComponent?: React.ComponentType<any> | React.ReactElement | null | undefined
  footerComponent?: React.ComponentType<any> | React.ReactElement | null | undefined
}

const handleComponent: (
  component: React.ComponentType<any> | React.ReactElement | null | undefined,
) => React.ReactNode = (component) => {
  if (component === null || component === undefined) {
    // Handle null or undefined case
    return <></>
  } else if (React.isValidElement(component)) {
    // Handle React element case
    // You can render this element directly
    return <>{component}</>
  } else {
    // Handle React component case
    // You can create an element from this component and render it
    const Component = component as React.ComponentType<any>
    return <Component />
  }
}

export const Search: FC<SearchProps> = ({
  searchCallback,
  renderSearchResultItem,
  searchResultItemKeyField,
  searchBarPlaceholderTx = "common.search.inputPlaceholder",
  isSearchingMessageTx = "common.search.isSearchingMessage",
  emptyResultsMessageTx = "common.search.noResultsFoundMessage",
  searchTextTooShortMessageTx = "common.search.moreCharactersRequiredMessage",
  showEndOfListMessage = true,
  endOfListMessageTx = "common.search.notWhatYouAreLookingForMessage",
  minimumSearchTextLength = 3,
  showInitialSuggestions = true,
  searchPromptComponent,
  emptyResultsComponent,
  footerComponent,
}: SearchProps) => {
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any[]>([])
  const isSearchInitialSuggestions = showInitialSuggestions && !searchText

  const isInvalidSearchText = () => {
    if (!searchText) return true

    // If search text is not Chinese, then require minimumSearchTextLength characters
    if (!/^[\u4E00-\u9FA5]+$/.test(searchText) && searchText.length < minimumSearchTextLength)
      return true

    return false
  }

  useEffect(() => {
    if (!isSearchInitialSuggestions && isInvalidSearchText()) return undefined

    setIsSearching(true)
    const searchTimeout = setTimeout(() => {
      console.debug("Search.useEffect() [searchText] searchCallback called with:", searchText)
      searchCallback(searchText || "*")
        .then((results) => {
          setSearchResult(results)
          setIsSearching(false)
        })
        .catch((e) => {
          logError(e, "Search.useEffect() [searchText] searchCallback error")
        })
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [searchText])

  const renderSearchResults = () => {
    // If isSearchInitialSuggestions is true, display initial result when searchText is empty
    if (!isSearchInitialSuggestions) {
      if (!searchText) return handleComponent(searchPromptComponent)

      if (isInvalidSearchText()) {
        return <Text tx={searchTextTooShortMessageTx} style={styles.textAlignCenter} />
      }
      if (isSearching) {
        return <Text tx={isSearchingMessageTx} style={styles.textAlignCenter} />
      }
    }

    return (
      <>
        <FlatList
          data={searchResult}
          renderItem={renderSearchResultItem}
          contentContainerStyle={styles.flexGrow}
          keyExtractor={(item) => item[searchResultItemKeyField]}
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListFooterComponent={
            <>
              {searchResult.length > 0 && showEndOfListMessage && (
                <Text tx={endOfListMessageTx} style={styles.textAlignCenter} />
              )}
              {!isSearching && handleComponent(footerComponent)}
            </>
          }
          ListEmptyComponent={() => {
            if (isSearching) return <LoadingIndicator />

            return (
              <>
                <Text tx={emptyResultsMessageTx} style={styles.textAlignCenter} />
                {handleComponent(emptyResultsComponent)}
              </>
            )
          }}
        />
      </>
    )
  }

  return (
    <>
      <TextField
        placeholderTx={searchBarPlaceholderTx}
        value={searchText}
        onChangeText={setSearchText}
      />
      {renderSearchResults()}
    </>
  )
}
