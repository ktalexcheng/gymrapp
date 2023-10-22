import * as admin from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  UserRepository,
  WorkoutRepository,
} from "../../app/data/repository"
import { RootStoreModel } from "../../app/stores/RootStore"
import { createNewUser } from "../utils/createNewUser"
import { readCSV } from "../utils/readCSV"

interface SampleUserData {
  userId: string
  firstName: string
  lastName: string
  email: string
  providerId: string
  privateAccount: boolean
  avatarUrl: string
}

describe.skip("Create sample users", () => {
  let rootStore
  let firestoreClient

  beforeEach(() => {
    // Setup connection to Firebase
    firestoreClient = admin.firestore()

    // Setup MST stores
    rootStore = RootStoreModel.create(
      {},
      {
        userRepository: new UserRepository(firestoreClient),
        activityRepository: new ActivityRepository(firestoreClient),
        exerciseRepository: new ExerciseRepository(firestoreClient),
        workoutRepository: new WorkoutRepository(firestoreClient),
        feedRepository: new FeedRepository(firestoreClient),
      },
    )
  })

  test("Create sample users", async () => {
    const sampleUserData = await readCSV<SampleUserData>(
      "/Users/alexcheng/AppDev/gymrapp/test/scripts/data/sample_users.csv",
      ",",
    )

    for (const user of sampleUserData) {
      await createNewUser(rootStore, user.email, user.firstName, user.lastName)
    }
  })
})
