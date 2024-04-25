/**
 * This file does the setup for integration with Reactotron, which is a
 * free desktop app for inspecting and debugging your React Native app.
 * @see https://github.com/infinitered/reactotron
 */
import { NativeModules, Platform } from "react-native"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { ArgType } from "reactotron-core-client"
import { mst } from "reactotron-mst"

import { goBack, navigate, resetRoot } from "app/navigators/navigationUtilities"

import { storage } from "app/services"
import { Reactotron } from "./ReactotronClient"

const reactotron = Reactotron.configure({
  name: require("../../../package.json").name,
  onConnect: () => {
    /** since this file gets hot reloaded, let's clear the past logs every time we connect */
    Reactotron.clear()
  },
}).use(
  mst({
    /** ignore some chatty `mobx-state-tree` actions  */
    filter: (event) => /postProcessSnapshot|@APPLY_SNAPSHOT/.test(event.name) === false,
  }),
)

if (Platform.OS !== "web") {
  reactotron.setAsyncStorageHandler?.(AsyncStorage)
  reactotron.useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
  })
}

/**
 * Reactotron allows you to define custom commands that you can run
 * from Reactotron itself, and they will run in your app.
 *
 * Define them in the section below with `onCustomCommand`. Use your
 * creativity -- this is great for development to quickly and easily
 * get your app into the state you want.
 *
 * NOTE: If you edit this file while running the app, you will need to do a full refresh
 * or else your custom commands won't be registered correctly.
 */
reactotron.onCustomCommand({
  title: "Show Dev Menu",
  description: "Opens the React Native dev menu",
  command: "showDevMenu",
  handler: () => {
    Reactotron.log("Showing React Native dev menu")
    NativeModules.DevMenu.show()
  },
})

reactotron.onCustomCommand<[{ name: "route"; type: ArgType.String }]>({
  title: "Navigate To Screen",
  description: "Navigates to a screen by name.",
  args: [{ name: "route", type: ArgType.String }],
  command: "navigateTo",
  handler: (args) => {
    const { route } = args ?? {}
    if (route) {
      Reactotron.log(`Navigating to: ${route}`)
      navigate(route as any) // this should be tied to the navigator, but since this is for debugging, we can navigate to illegal routes
    } else {
      Reactotron.log("Could not navigate. No route provided.")
    }
  },
})

reactotron.onCustomCommand({
  title: "Go Back",
  description: "Goes back",
  command: "goBack",
  handler: () => {
    Reactotron.log("Going back")
    goBack()
  },
})

reactotron.onCustomCommand({
  title: "Get all Async Storage keys",
  description: "Print all the keys stored in Async Storage",
  command: "printAllAsyncStorageKeys",
  handler: () => {
    AsyncStorage.getAllKeys().then((keys) => {
      Reactotron.log("All keys stored in AsyncStorage:", keys)
      console.debug("All keys stored in AsyncStorage", keys)
    })
  },
})

reactotron.onCustomCommand({
  title: "Print Async Storage value",
  description: "Print the value stored in Async Storage",
  command: "printAsyncStorageValue",
  args: [{ name: "Key", type: ArgType.String }],
  handler: (args) => {
    const { Key } = args ?? {}
    if (!Key) {
      Reactotron.log("No key provided")
      return
    }
    AsyncStorage.getItem(Key).then((value) => {
      Reactotron.log("Async Storage key", Key, "has value:", value)
      console.debug("Async Storage key", Key, "has value:", value)
    })
  },
})

reactotron.onCustomCommand({
  title: "Clear Async Storage",
  description:
    "Remove all data stored in Async Storage (including root store snapshot and navigation state)",
  command: "resetAsyncStorage",
  handler: () => {
    Reactotron.log("Clearing all data in Async Storage")
    storage.clearAllData()
  },
})

reactotron.onCustomCommand({
  title: "Reset Navigation State",
  description: "Resets the navigation state",
  command: "resetNavigation",
  handler: () => {
    Reactotron.log("Resetting navigation state")
    resetRoot({ index: 0, routes: [] })
  },
})

/**
 * We're going to add `console.tron` to the Reactotron object.
 * Now, anywhere in our app in development, we can use Reactotron like so:
 *
 * ```
 * if (__DEV__) {
 *  console.tron.display({
 *    name: 'JOKE',
 *    preview: 'What's the best thing about Switzerland?',
 *    value: 'I don't know, but the flag is a big plus!',
 *    important: true
 *  })
 * }
 * ```
 *
 * Use this power responsibly! :)
 */
console.tron = reactotron

/**
 * We tell typescript about our dark magic
 *
 * You can also import Reactotron yourself from ./reactotronClient
 * and use it directly, like Reactotron.log('hello world')
 */
declare global {
  interface Console {
    /**
     * Reactotron client for logging, displaying, measuring performance, and more.
     * @see https://github.com/infinitered/reactotron
     *
     * @example
     * if (__DEV__) {
     *  console.tron.display({
     *    name: 'JOKE',
     *    preview: 'What's the best thing about Switzerland?',
     *    value: 'I don't know, but the flag is a big plus!',
     *    important: true
     *  })
     * }
     *
     */
    tron: typeof reactotron
  }
}

/**
 * Now that we've setup all our Reactotron configuration, let's connect!
 */
reactotron.connect()
