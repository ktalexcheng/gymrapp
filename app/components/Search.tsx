import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import React, { FC, useEffect, useState } from "react"
import { FlatList, ListRenderItem, ViewProps } from "react-native"
import { Spacer } from "./Spacer"
import { Text } from "./Text"
import { TextField } from "./TextField"

export interface SearchProps extends ViewProps {
  searchBarPlaceholderTx?: TxKeyPath
  isSearchingMessageTx?: TxKeyPath
  emptyResultsMessageTx?: TxKeyPath
  searchTextTooShortMessageTx?: TxKeyPath
  endOfListMessageTx?: TxKeyPath
  minimumSearchTextLength?: number
  searchCallback: (searchText: string) => Promise<any[]>
  renderSearchResultItem: ListRenderItem<any>
  searchResultItemKeyField: string
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
  searchBarPlaceholderTx = "common.search.inputPlaceholder",
  isSearchingMessageTx = "common.search.isSearchingMessage",
  emptyResultsMessageTx = "common.search.noResultsFoundMessage",
  searchTextTooShortMessageTx = "common.search.moreCharactersRequiredMessage",
  endOfListMessageTx = "common.search.notWhatYouAreLookingForMessage",
  minimumSearchTextLength = 3,
  searchCallback,
  renderSearchResultItem,
  searchResultItemKeyField,
  searchPromptComponent,
  emptyResultsComponent,
  footerComponent,
}: SearchProps) => {
  const [searchText, setSearchText] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any[]>([])

  const isInvalidSearchText = () => {
    if (!searchText) return true

    // If search text is not Chinese, then require minimumSearchTextLength characters
    if (!/^[\u4E00-\u9FA5]+$/.test(searchText) && searchText.length < minimumSearchTextLength)
      return true

    return false
  }

  useEffect(() => {
    setSearchText("")
    setIsSearching(false)
    setSearchResult([])
  }, [searchCallback, renderSearchResultItem, searchResultItemKeyField])

  useEffect(() => {
    if (isInvalidSearchText()) return undefined

    setIsSearching(true)
    const searchTimeout = setTimeout(() => {
      console.debug("Search.useEffect searchCallback called with:", searchText)
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
    if (!searchText) return handleComponent(searchPromptComponent)

    if (isInvalidSearchText()) {
      return <Text tx={searchTextTooShortMessageTx} style={styles.textAlignCenter} />
    }
    if (isSearching) {
      return <Text tx={isSearchingMessageTx} style={styles.textAlignCenter} />
    }
    if (!searchResult.length) {
      return (
        <>
          <Text tx={emptyResultsMessageTx} style={styles.textAlignCenter} />
          {handleComponent(emptyResultsComponent)}
          {handleComponent(footerComponent)}
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
          ListFooterComponent={() => (
            <>
              <Text tx={endOfListMessageTx} style={styles.textAlignCenter} />
              {handleComponent(footerComponent)}
            </>
          )}
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
