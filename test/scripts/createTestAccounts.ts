import * as admin from "firebase-admin"
import { AppColorScheme, AppLocale, WeightUnit } from "../../app/data/constants"
import { UserRepository } from "../../app/data/repository"
import { readCSV } from "../utils/readCSV"

const TEST_ACCOUNTS_FILE_PATH =
  "/Users/alexcheng/AppDev/gymrapp/test/scripts/data/test_accounts.csv"

interface TestAccountData {
  email: string
  password: string
  firstName: string
  lastName: string
}

describe("create test accounts", () => {
  it("should create test accounts", async () => {
    const firestoreClient = admin.firestore()
    const userRepository = new UserRepository(firestoreClient)
    const testAccountsData = await readCSV<TestAccountData>(TEST_ACCOUNTS_FILE_PATH, ",")

    let count = 1
    for (const testAccount of testAccountsData) {
      const userRecord = await admin.auth().createUser({
        email: testAccount.email,
        emailVerified: true,
        password: testAccount.password,
        disabled: false,
      })

      userRepository.setUserId(userRecord.uid)
      await userRepository.create({
        userId: userRecord.uid,
        userHandle: "testuser" + count,
        _userHandleLower: "testuser" + count,
        firstName: testAccount.firstName,
        lastName: testAccount.lastName,
        email: testAccount.email,
        privateAccount: false,
        providerId: "test",
        myGyms: [],
        preferences: {
          appLocale: AppLocale.en_US,
          appColorScheme: AppColorScheme.Auto,
          weightUnit: WeightUnit.kg,
          autoRestTimerEnabled: true,
          restTime: 60,
        },
      })

      count++
    }
  })
})
