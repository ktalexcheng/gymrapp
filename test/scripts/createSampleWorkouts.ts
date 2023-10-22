import * as admin from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  UserRepository,
  WorkoutRepository,
} from "../../app/data/repository"
import { RootStoreModel } from "../../app/stores/RootStore"
import { createNewUserFollows } from "../utils/createNewUserFollows"
import { createWorkoutsFromStrongExport } from "../utils/createWorkoutsFromStrongExport"

// Only leveraging the test framework to easily run these scripts
describe.skip("Create sample workouts", () => {
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

  test("Create sample workouts", async () => {
    await createWorkoutsFromStrongExport(
      firestoreClient,
      rootStore,
      "/Users/alexcheng/AppDev/gymrapp/test/data/sample_workouts_strong.csv",
      "user2@test.com",
    )
  })

  test("Test fan-out on follow", async () => {
    await createNewUserFollows(firestoreClient, rootStore, "user@test.com", "user2@test.com")
  })
})
