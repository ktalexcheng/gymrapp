import firestore from "@react-native-firebase/firestore"
import {
  ExerciseRepository,
  FeedRepository,
  GymRepository,
  PrivateExerciseRepository,
  PrivateUserRepository,
  PublicUserRepository,
  WorkoutRepository,
} from "app/data/repository"
import { ActivityRepository } from "app/data/repository/activityRepository"
import { createContext, useContext, useEffect, useState } from "react"
import { setReactotronRootStore } from "../../services/reactotron"
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
export interface RootStoreDependencies {
  privateUserRepository: PrivateUserRepository
  publicUserRepository: PublicUserRepository
  activityRepository: ActivityRepository
  exerciseRepository: ExerciseRepository
  privateExerciseRepository: PrivateExerciseRepository
  workoutRepository: WorkoutRepository
  feedRepository: FeedRepository
  gymRepository: GymRepository
}

const _firestoreClient = firestore()
const _rootStore = RootStoreModel.create({}, {
  privateUserRepository: new PrivateUserRepository(_firestoreClient),
  publicUserRepository: new PublicUserRepository(_firestoreClient),
  activityRepository: new ActivityRepository(_firestoreClient),
  exerciseRepository: new ExerciseRepository(_firestoreClient),
  privateExerciseRepository: new PrivateExerciseRepository(_firestoreClient),
  workoutRepository: new WorkoutRepository(_firestoreClient),
  feedRepository: new FeedRepository(_firestoreClient),
  gymRepository: new GymRepository(_firestoreClient),
} as RootStoreDependencies)

/**
 * The RootStoreContext provides a way to access
 * the RootStore in any screen or component.
 */
const RootStoreContext = createContext<RootStore>(_rootStore)

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
export const useInitialRootStore = (callback: () => void | Promise<void>) => {
  const rootStore = useStores()
  const [rehydrated, setRehydrated] = useState(false)

  // Kick off initial async loading actions, like loading fonts and rehydrating RootStore
  useEffect(() => {
    let _unsubscribe
    ;(async () => {
      // set up the RootStore (returns the state restored from AsyncStorage)
      const { restoredState, unsubscribe } = await setupRootStore(rootStore)
      _unsubscribe = unsubscribe

      // reactotron integration with the MST root store (DEV only)
      setReactotronRootStore(rootStore, restoredState)

      // let the app know we've finished rehydrating
      setRehydrated(true)

      // invoke the callback, if provided
      if (callback) callback()
    })()

    return () => {
      // cleanup
      if (_unsubscribe) _unsubscribe()
    }
  }, [])

  return { rootStore, rehydrated }
}
