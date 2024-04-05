import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React from "react"
import { RefreshControl as RNRefreshControl, RefreshControlProps } from "react-native"

export const ThemedRefreshControl = observer((props: RefreshControlProps) => {
  const { themeStore } = useStores()

  return <RNRefreshControl tintColor={themeStore.colors("logo")} {...props} />
})
