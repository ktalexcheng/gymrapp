import * as admin from "firebase-admin"
import { initializeApp } from "firebase/app"
import { getFunctions, httpsCallable } from "firebase/functions"
// require("dotenv").config({ path: ".env.local" })
require("dotenv").config({ path: ".env.local" })

declare const tron // eslint-disable-line @typescript-eslint/no-unused-vars

// Note: Disable jest.useFakeTimers() for now in order to properly catch timeout using firebase-admin
// jest.useFakeTimers()
declare global {
  let __TEST__
}

// If not using emulator, remove these environment variables
if (process.env.EXPO_PUBLIC_USE_EMULATOR !== "1") {
  console.log("Connecting to Firebase")
  delete process.env.FIRESTORE_EMULATOR_HOST
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST
  delete process.env.FIREBASE_STORAGE_EMULATOR_HOST
} else {
  console.log("Connecting to Firebase emulators")
}

// Set environment variable GOOGLE_APPLICATION_CREDENTIALS to path of the service account key
// See: https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    "Environment variable GOOGLE_APPLICATION_CREDENTIALS not set and is required for firebase-admin",
  )
}
if (!process.env.FIREBASE_WEB_CONFIG) {
  throw new Error(
    "Environment variable FIREBASE_WEB_CONFIG not set and is required for react-native-firebase",
  )
}
console.log("Environment variables set:", {
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  FIREBASE_WEB_CONFIG: process.env.FIREBASE_WEB_CONFIG,
})
admin.initializeApp()
const firebaseApp = initializeApp(require(process.env.FIREBASE_WEB_CONFIG))
const firebaseFunctionsClient = getFunctions(firebaseApp)
console.log("Firebase project ID:", firebaseApp.options.projectId)
console.log("Initiating Jest tests")

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)

jest.mock("i18n-js", () => ({
  currentLocale: () => "en",
  t: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
}))

jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter")

jest.mock("expo-constants", () => {
  return {
    ...jest.requireActual("expo-constants"),
    expoConfig: {
      extra: {
        googleClientId: "test",
      },
    },
  }
})

jest.mock("expo-crypto", () => {
  return {
    randomUUID: jest.fn(() => {
      return Math.random().toString()
    }),
  }
})

// jest.doMock is not hoisted, jest.mock is hoisted

jest.doMock("@react-native-firebase/crashlytics", () => {
  return {
    // ...jest.requireActual("@react-native-firebase/crashlytics"),
    __esModule: true,
    default: jest.fn(() => ({
      log: jest.fn(),
    })),
  }
})

jest.doMock("@react-native-firebase/functions", () => {
  return {
    // ...jest.requireActual("@react-native-firebase/functions"),
    __esModule: true,
    default: jest.fn(() => {
      return {
        httpsCallable: jest.fn((name: string) => {
          return httpsCallable(firebaseFunctionsClient, name)
        }),
      }
    }),
  }
})

// @react-native-firebase relies on native modules that will not work in the jest environment
jest.doMock("@react-native-firebase/firestore", () => {
  // Depending on the import strategy, we might need to mock the default export or the named exports
  const firestore = admin.firestore
  firestore.FieldValue = admin.firestore.FieldValue
  firestore.FieldPath = admin.firestore.FieldPath

  return {
    // ...jest.requireActual("@react-native-firebase/firestore"),
    __esModule: true,
    default: firestore,
    FieldValue: admin.firestore.FieldValue,
    FieldPath: admin.firestore.FieldPath,
    FirebaseFirestoreTypes: {
      // ...jest.requireActual("@react-native-firebase/firestore").FirebaseFirestoreTypes,
      Timestamp: admin.firestore.Timestamp,
    },
  }
})

jest.doMock("@react-native-firebase/crashlytics", () => {})
