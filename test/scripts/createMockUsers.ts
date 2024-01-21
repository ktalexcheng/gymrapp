import * as admin from "firebase-admin"
import { AppLocale, WeightUnit } from "../../app/data/constants"
import { UserRepository } from "../../app/data/repository"
import { readCSV } from "../utils/readCSV"

const MOCK_USERS_FILE_PATH = "/Users/alexcheng/AppDev/gymrapp/test/scripts/data/mock_users.csv"

interface MockUserData {
  Gender: string
  NameSet: string
  GivenName: string
  Surname: string
  CountryFull: string
  EmailAddress: string
  Username: string
  Password: string
  Birthday: string
  Kilograms: string
  Centimeters: string
  GUID: string
}

describe("create mock users", () => {
  it("should create mock users", async () => {
    // Setup connection to Firebase
    const firestoreClient = admin.firestore()
    const userRepository = new UserRepository(firestoreClient)

    // Initialize userRepository with a fake userId, it has no effect this particular script
    userRepository.setUserId("mock")

    // Delete existing mock users
    await firestoreClient
      .collection("users")
      .where("providerId", "==", "mock")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.delete()
        })
      })

    // Mock user data
    const mockUserData = await readCSV<MockUserData>(MOCK_USERS_FILE_PATH, ",")

    // Create user document
    for (const user of mockUserData) {
      const userHandle = user.EmailAddress.match(/^([\w.-]{1,30})@/)[1]
      await userRepository.create({
        userId: "MOCK-" + user.GUID,
        userHandle,
        _userHandleLower: userHandle.toLowerCase(),
        firstName: user.GivenName,
        lastName: user.Surname,
        email: user.EmailAddress,
        privateAccount: false,
        providerId: "mock",
        preferences: {
          appLocale: AppLocale.en_US,
          weightUnit: WeightUnit.kg,
          autoRestTimerEnabled: false,
          restTime: 0,
        },
        exerciseHistory: {},
        myGyms: [],
      })
    }
  })
})
