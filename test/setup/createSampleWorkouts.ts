import * as admin from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  PrivateUserRepository,
  PublicUserRepository,
  WorkoutRepository,
} from "../../app/data/repository"
import { RootStoreModel } from "../../app/stores/RootStore"
import { createNewUserFollows } from "./utils/createNewUserFollows"
import { createWorkoutsFromStrongExport } from "./utils/createWorkoutsFromStrongExport"

describe("Create sample workouts", () => {
  let rootStore
  let firestoreClient

  beforeEach(() => {
    // Setup connection to Firebase
    admin.initializeApp()
    firestoreClient = admin.firestore()

    // Setup MST stores
    rootStore = RootStoreModel.create(
      {},
      {
        privateUserRepository: new PrivateUserRepository(firestoreClient),
        publicUserRepository: new PublicUserRepository(firestoreClient),
        activityRepository: new ActivityRepository(firestoreClient),
        exerciseRepository: new ExerciseRepository(firestoreClient),
        workoutRepository: new WorkoutRepository(firestoreClient),
        feedRepository: new FeedRepository(firestoreClient),
      },
    )
  })

  test.skip("Create sample workouts", async () => {
    await createWorkoutsFromStrongExport(
      firestoreClient,
      rootStore,
      "/Users/alexcheng/AppDev/gymrapp/test/data/sample_workouts.csv",
      "user2@test.com",
    )
  })

  test.skip("Test fan-out on follow", async () => {
    await createNewUserFollows(firestoreClient, rootStore, "user@test.com", "user2@test.com")
  })
})
