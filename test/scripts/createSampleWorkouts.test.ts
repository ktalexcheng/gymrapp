import * as admin from "firebase-admin"
import { repositoryFactory } from "../../app/data/repository"
import { RootStoreModel } from "../../app/stores/RootStore"
import { createWorkoutsFromStrongExport } from "../utils/createWorkoutsFromStrongExport"

// Only leveraging the test framework to easily run these scripts
describe("Create sample workouts", () => {
  let rootStore
  let firestoreClient

  beforeEach(() => {
    // Setup connection to Firebase
    firestoreClient = admin.firestore()

    // Setup MST stores
    rootStore = RootStoreModel.create({}, repositoryFactory(firestoreClient))
  })

  test("Create sample workouts", async () => {
    await createWorkoutsFromStrongExport(
      firestoreClient,
      rootStore,
      "/Users/alexcheng/AppDev/gymrapp/test/data/sample_workouts_strong.csv",
      "user@test.com",
    )
  })

  // test("Test fan-out on follow", async () => {
  //   await createNewUserFollows(firestoreClient, rootStore, "user@test.com", "user2@test.com")
  // })
})
