/**
 * This file is where we do "rehydration" of your RootStore from AsyncStorage.
 * This lets you persist your state between app launches.
 *
 * Navigation state persistence is handled in navigationUtilities.tsx.
 *
 * Note that Fast Refresh doesn't play well with this file, so if you edit this,
 * do a full refresh of your app instead.
 *
 * @refresh reset
 */
import * as Application from "expo-application"
import { IDisposer, applySnapshot, onSnapshot } from "mobx-state-tree"
import * as storage from "../../utils/storage"
import { RootStore, RootStoreSnapshot } from "../RootStore"

/**
 * Setup the root state.
 */
let _disposer: IDisposer
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: RootStoreSnapshot | undefined
  const thisBuildVersion = Application.nativeBuildVersion

  try {
    // Anytime a new build is detected, we'll want to clear out the old state
    const lastKnownBuildVersion = await storage.load("BUILD_VERSION_STORAGE_KEY")
    console.debug("setupRootStore: Checking build version", {
      lastKnownBuildVersion,
      thisBuildVersion,
    })
    if (lastKnownBuildVersion !== thisBuildVersion) {
      console.debug("setupRootStore: Build version changed, clearing state")
      await storage.remove("ROOT_STATE_STORAGE_KEY")
    } else {
      // load the last known state from AsyncStorage
      console.debug("setupRootStore: Loading root store snapshot from AsyncStorage")
      restoredState = (await storage.load("ROOT_STATE_STORAGE_KEY")) as RootStoreSnapshot
      applySnapshot(rootStore, restoredState)
    }

    await storage.save("BUILD_VERSION_STORAGE_KEY", thisBuildVersion)
  } catch (e: any) {
    // if there's any problems loading, then inform the dev what happened
    if (__DEV__) {
      console.error("setupRootStore error:", e.message)
      console.tron.error(e.message, null)
    }
  }

  // stop tracking state changes if we've already setup
  if (_disposer) _disposer()

  // track changes & save to AsyncStorage
  _disposer = onSnapshot(rootStore, (snapshot) => storage.save("ROOT_STATE_STORAGE_KEY", snapshot))

  const unsubscribe = () => {
    _disposer()
    // _disposer = undefined
  }

  return { rootStore, restoredState, unsubscribe }
}
