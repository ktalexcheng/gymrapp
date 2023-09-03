import * as admin from "firebase-admin"
import { types } from "mobx-state-tree"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  PrivateUserRepository,
  PublicUserRepository,
  WorkoutRepository,
} from "../app/data/repository"
import { FeedStoreModel } from "../app/stores/FeedStore"
import { UserStoreModel } from "../app/stores/UserStore"
import { WorkoutStoreModel } from "../app/stores/WorkoutStore"
import { createExercisesFromStrongExport } from "./utils/createExercisesFromStrongExport"
import { createNewUserFollows } from "./utils/createNewUserFollows"

describe("Create sample workouts", () => {
  let rootStore
  let firestoreClient

  beforeEach(() => {
    // Setup connection to Firebase
    admin.initializeApp()
    firestoreClient = admin.firestore()

    // Setup MST stores
    rootStore = types
      .model("TestRootStore")
      .props({
        userStore: types.optional(UserStoreModel, {}),
        workoutStore: types.optional(WorkoutStoreModel, {}),
        feedStore: types.optional(FeedStoreModel, {}),
      })
      .create(
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

  test("Create sample workouts", async () => {
    await createExercisesFromStrongExport(
      firestoreClient,
      rootStore,
      "/Users/alexcheng/AppDev/gymrapp/test/data/sample_workouts.csv",
      "user2@test.com",
    )
  })

  test("Test fan-out on follow", async () => {
    await createNewUserFollows(firestoreClient, rootStore, "user@test.com", "user2@test.com")
  })

  test.only("Test FeedStore.refreshFeedItems()", async () => {
    const { feedStore, userStore } = rootStore
    // Get user ID
    const userSnapshot = await firestoreClient
      .collection("usersPrivate")
      .where("email", "==", "user@test.com")
      .limit(1)
      .get()
    const userId = userSnapshot.docs[0].id
    userStore.loadUserWithId(userId)

    await feedStore.refreshFeedItems()
    expect(feedStore.feedItems.length).toBeGreaterThan(0)
    expect(feedStore.feedItems.length).toBeLessThanOrEqual(50)
    expect(feedStore.feedWorkouts.size).toBeGreaterThan(0)
    expect(feedStore.feedWorkouts.size).toBeLessThanOrEqual(50)
  })
})
