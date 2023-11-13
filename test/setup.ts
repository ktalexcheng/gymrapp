// we always make sure 'react-native' gets included first
import * as admin from "firebase-admin"
import { initializeApp } from "firebase/app"
import { getFunctions, httpsCallable } from "firebase/functions"

declare const tron // eslint-disable-line @typescript-eslint/no-unused-vars

// Note: Disable jest.useFakeTimers() for now in order to properly catch timeout using firebase-admin
// jest.useFakeTimers()
declare global {
  let __TEST__
}

// libraries to mock
// jest.doMock("react-native", () => {
//   // Extend ReactNative
//   return Object.setPrototypeOf(
//     {
//       Image: {
//         ...ReactNative.Image,
//         resolveAssetSource: jest.fn((_source) => mockFile), // eslint-disable-line @typescript-eslint/no-unused-vars
//         getSize: jest.fn(
//           (
//             uri: string, // eslint-disable-line @typescript-eslint/no-unused-vars
//             success: (width: number, height: number) => void,
//             failure?: (_error: any) => void, // eslint-disable-line @typescript-eslint/no-unused-vars
//           ) => success(100, 100),
//         ),
//       },
//     },
//     ReactNative,
//   )
// })

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

// Do this in setup so it is done only once for all tests
admin.initializeApp()
export const firebaseApp = initializeApp(require("./firebase-sa-key.json"))
export const firebaseFunctionsClient = getFunctions(firebaseApp)

jest.mock("@react-native-firebase/functions", () => {
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
jest.mock("@react-native-firebase/firestore", () => {
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

// jest.mock("@react-native-firebase/auth", () => {
//   return {
//     // ...jest.requireActual("@react-native-firebase/auth"),
//     __esModule: true,
//     default: jest.fn(() => {
//       let currentUser: UserRecord

//       return {
//         createUserWithEmailAndPassword: async (email: string, password: string) => {
//           const userRecord = await admin.auth().createUser({
//             email,
//             password,
//           })
//           currentUser = userRecord

//           return {
//             user: {
//               uid: userRecord.uid,
//               email: userRecord.email,
//             },
//             additionalUserInfo: {
//               providerId: "jest-mock",
//             },
//           } as FirebaseAuthTypes.UserCredential
//         },
//         signInWithEmailAndPassword: async (email: string, password: string) => {
//           const userRecord = await admin.auth().getUserByEmail(email)
//           currentUser = userRecord

//           return {
//             user: {
//               uid: userRecord.uid,
//               email: userRecord.email,
//             },
//             additionalUserInfo: {
//               providerId: "jest-mock",
//             },
//           } as FirebaseAuthTypes.UserCredential
//         },
//         signOut: async () => {
//           currentUser = undefined
//         },
//         currentUser: {
//           delete: async () => {
//             await admin.auth().deleteUser(currentUser.uid)
//           },
//         },
//       }
//     }),
//   }
// })
