import { repositorySingletons } from "app/data/repository"
import { createContext, useContext, useEffect, useState } from "react"
import { RootStore, RootStoreModel } from "../RootStore"
import { setupRootStore } from "./setupRootStore"

/**
 * Create the initial (empty) global RootStore instance here.
 *
 * Later, it will be rehydrated in app.tsx with the setupRootStore function.
 *
 * If your RootStore requires specific properties to be instantiated,
 * you can do so here.
 *
 * If your RootStore has a _ton_ of sub-stores and properties (the tree is
 * very large), you may want to use a different strategy than immediately
 * instantiating it, although that should be rare.
 */
export type RootStoreDependencies = typeof repositorySingletons

export const rootStore = RootStoreModel.create({}, repositorySingletons)

/**
 * The RootStoreContext provides a way to access
 * the RootStore in any screen or component.
 */
const RootStoreContext = createContext<RootStore>(rootStore)

/**
 * You can use this Provider to specify a *different* RootStore
 * than the singleton version above if you need to. Generally speaking,
 * this Provider & custom RootStore instances would only be used in
 * testing scenarios.
 */
export const RootStoreProvider = RootStoreContext.Provider

/**
 * A hook that screens and other components can use to gain access to
 * our stores:
 *
 * const rootStore = useStores()
 *
 * or:
 *
 * const { someStore, someOtherStore } = useStores()
 *
 * Avoid destructing stores, especially views as it could result in a stagnant view:
 *
 * ```
 * // Use
 * { authenticationStore: authStore } = useStores()
 * if (authStore.isAuthenticated) return
 *
 * // Avoid
 * { authenticationStore: { isAuthenticated } } = useStores()
 * ```
 */
export const useStores = () => useContext(RootStoreContext)

/**
 * Used only in the app.tsx file, this hook sets up the RootStore
 * and then rehydrates it. It connects everything with Reactotron
 * and then lets the app know that everything is ready to go.
 */
export const useInitialRootStore = (callback: (rootStore: RootStore) => void | Promise<void>) => {
  const rootStore = useStores()
  const [rehydrated, setRehydrated] = useState(false)

  // Kick off initial async loading actions, like loading fonts and rehydrating RootStore
  useEffect(() => {
    let _unsubscribe: () => void | undefined
    ;(async () => {
      // set up the RootStore (returns the state restored from AsyncStorage)
      const { unsubscribe } = await setupRootStore(rootStore)
      _unsubscribe = unsubscribe

      // reactotron integration with the MST root store (DEV only)
      if (__DEV__) {
        console.tron.trackMstNode(rootStore)
      }

      // let the app know we've finished rehydrating
      setRehydrated(true)

      // invoke the callback, if provided
      if (callback) callback(rootStore)
    })()

    return () => {
      // cleanup
      if (_unsubscribe !== undefined) _unsubscribe()
    }
  }, [])

  return { rootStore, rehydrated }
}
