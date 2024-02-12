import { ExerciseSetType, ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { repositorySingletons } from "app/data/repository/repositoryFactory"
import { User } from "app/data/types"
import { RootStore, RootStoreModel } from "app/stores/RootStore"
import * as admin from "firebase-admin"
import { firestore } from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  PrivateExerciseRepository,
  UserRepository,
  WorkoutInteractionRepository,
  WorkoutRepository,
} from "../app/data/repository"
import { exercises } from "./data/exercises"
import { getWorkout } from "./data/workouts"
import { addSetToExercise } from "./utils/addSetToExercise"
import { createNewUser } from "./utils/createNewUser"
import { deleteCollection } from "./utils/deleteCollection"
import { retryExpectAsync } from "./utils/retryExpectAsync"

const getUserUsingEmail = async (firestoreClient: firestore.Firestore, email: string) => {
  const userSnapshot = await firestoreClient
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get()

  const userDoc = userSnapshot.docs[0]
  return userDoc.data() as User
}

describe.skip("Main test suite", () => {
  let firestoreClient: admin.firestore.Firestore
  const maxRetries = 5 // For tests that trigger Firebase Functions, we might need to wait for the function to complete
  const retryDelay = 1000 // ms

  const testUserMainEmail = "jest@test.com"
  const testUser2Email = "jest2@test.com"
  // rootStoreTestUserMain is its own variable simply because it is used often
  let rootStoreTestUserMain: RootStore
  const testRootStores = new Map<string, RootStore>()
  const testRepositories = new Map<string, Partial<typeof repositorySingletons>>()

  const rootStoreFactory = async (firestoreClient, firstName, lastName, testUserEmail) => {
    const repositories = {
      userRepository: new UserRepository(firestoreClient),
      privateExerciseRepository: new PrivateExerciseRepository(firestoreClient),
      activityRepository: new ActivityRepository(firestoreClient),
      exerciseRepository: new ExerciseRepository(firestoreClient),
      workoutRepository: new WorkoutRepository(firestoreClient),
      workoutInteractionRepository: new WorkoutInteractionRepository(firestoreClient),
      feedRepository: new FeedRepository(firestoreClient),
    }
    testRepositories.set(testUserEmail, repositories)

    // Setup MST stores
    const rootStore = RootStoreModel.create({}, repositories)

    // Create test user
    /**
     * Note: We cannot use the AuthenticationStore to create test users because
     * the @react-native-firebase/auth library is stateful so we will not be able
     * to manage multiple users at the same time. Using the firebase-admin library instead.
     */
    const authUser = await admin
      .auth()
      .getUserByEmail(testUserEmail)
      .catch(() => undefined)
    if (authUser) {
      // If user auth exists, delete it
      await testUserCleanup(authUser.uid)
    }
    await createNewUser(rootStore, testUserEmail, firstName, lastName)
    testRootStores.set(testUserEmail, rootStore)

    return rootStore
  }

  const testUserCleanup = async (userId: string) => {
    // Delete documents in "userFollows/{userId}/followers" collection
    await deleteCollection(firestoreClient, `userFollows/${userId}/followers`)

    // Delete documents in "userFollows/{userId}/following" collection
    await deleteCollection(firestoreClient, `userFollows/${userId}/following`)

    // Delete document in "workouts" collection where byUserId == userID
    // Delete this after userFollows otherwise backend will fan out to followers
    const workouts = await firestoreClient
      .collection("workouts")
      .where("byUserId", "==", userId)
      .get()
    for (const workoutDoc of workouts.docs) {
      await workoutDoc.ref.delete()
    }

    // Delete documents in "feeds/{userId}/feedItems" collection
    await deleteCollection(firestoreClient, `feeds/${userId}/feedItems`)

    // Try multiple times because a lot of backend functions will update this collection
    // so it might be deleted but then re-created
    let feedExists = true
    while (feedExists) {
      await firestoreClient.collection("feeds").doc(userId).delete()
      await new Promise((resolve) => setTimeout(resolve, 500))
      const feedDoc = await firestoreClient.collection("feeds").doc(userId).get()
      feedExists = feedDoc.exists
    }

    // Delete document in "users" collection
    // Delete user document last because other collections will trigger updates to this document
    await firestoreClient.collection("users").doc(userId).delete()

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId)
  }

  beforeEach(async () => {
    // Setup connection to Firebase
    firestoreClient = admin.firestore()

    // Setup MST stores for main test user
    rootStoreTestUserMain = await rootStoreFactory(
      firestoreClient,
      "Jest",
      "Test",
      testUserMainEmail,
    )

    // Create other test users
    await rootStoreFactory(firestoreClient, "Jest 2", "Test", testUser2Email)
  })

  afterEach(async () => {
    // Delete test user and all other test users
    for (const testUserStore of testRootStores.values()) {
      console.debug("Cleaning up test user:", testUserStore.userStore.user)
      await testUserCleanup(testUserStore.userStore.userId!)
    }
  })

  describe("Integration tests", () => {
    test("When a followee creates a workout, the follower should see it in their feed", async () => {
      // Let the other test user follow the main test user
      const { userStore: userStoreTestUser2 } = testRootStores.get(testUser2Email)!
      const testUserMain = await getUserUsingEmail(firestoreClient, testUserMainEmail)
      await userStoreTestUser2.followUser(testUserMain.userId)

      // Let main test user create a workout
      const { workoutStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise(exercises.testExercise1)
      workoutStore.addSet(0)
      workoutStore.endWorkout()
      await workoutStore.saveWorkout(false, userStoreTestUser2.user!)

      // Check that the other test user has the workout in their feed
      const { feedStore: feedStoreTestUser2 } = testRootStores.get(testUser2Email)!
      const expectFeedItems = async () => {
        await feedStoreTestUser2.refreshFeedItems()
        // expect(feedStoreTestUser2.feedItems.length).toBe(1)
        expect(feedStoreTestUser2.feedWorkouts.size).toBe(1)
      }

      return retryExpectAsync(expectFeedItems, retryDelay, maxRetries)
    })
  })

  describe("UserStore", () => {
    test("should create a new user document in Firestore", async () => {
      const userData = await getUserUsingEmail(firestoreClient, testUserMainEmail)
      expect(userData).toBeDefined()
    })
  })

  describe("WorkoutStore", () => {
    test("should manage exercises and sets order correctly", () => {
      const { workoutStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise(exercises.testExercise1)
      addSetToExercise(workoutStore, 0, {
        setType: ExerciseSetType.Normal,
        volumeType: ExerciseVolumeType.Reps,
        weight: 100,
        reps: 10,
        isCompleted: true,
      })
      addSetToExercise(workoutStore, 0, {
        setType: ExerciseSetType.Normal,
        volumeType: ExerciseVolumeType.Reps,
        weight: 120,
        reps: 12,
        isCompleted: true,
      })

      expect(workoutStore.exercises.length).toEqual(1)
      expect(workoutStore.exercises.at(0)!.setsPerformed.length).toEqual(2)

      workoutStore.removeSet(0, 0)
      expect(workoutStore.exercises.at(0)!.setsPerformed.length).toEqual(1)
      expect(workoutStore.exercises.at(0)!.setsPerformed.at(0)!.setOrder).toEqual(0)

      workoutStore.addExercise(exercises.testExercise2)
      expect(workoutStore.exercises.length).toEqual(2)

      workoutStore.removeExercise(0)
      expect(workoutStore.exercises.length).toEqual(1)
      expect(workoutStore.exercises.at(0)!.exerciseId).toEqual(exercises.testExercise2.exerciseId)
    })

    test("saveWorkout() should create new workout document and update user workoutMetas and exerciseHistory", async () => {
      const { workoutStore, userStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise(exercises.testExercise1)
      addSetToExercise(workoutStore, 0, {
        setType: ExerciseSetType.Normal,
        volumeType: ExerciseVolumeType.Reps,
        weight: 100,
        reps: 10,
        isCompleted: true,
      })
      workoutStore.endWorkout()
      await workoutStore.saveWorkout(false, userStore.user!)

      const userData = await getUserUsingEmail(firestoreClient, testUserMainEmail)

      // Check workoutMetas has been updated
      if (!userData.workoutMetas) throw new Error("userData.workoutMetas not found")
      expect(Object.keys(userData.workoutMetas).length).toEqual(1)
      Object.entries(userData.workoutMetas).forEach(([_, workoutMeta]) => {
        expect(workoutMeta).toEqual(
          expect.objectContaining({
            startTime: expect.any(admin.firestore.Timestamp),
          }),
        )
      })

      // Check exerciseHistory has been updated
      if (!userData.exerciseHistory) throw new Error("userData.exerciseHistory not found")
      expect(Object.keys(userData.exerciseHistory).length).toEqual(1)
      Object.entries(userData.exerciseHistory).forEach(([exerciseId, exerciseHistory]) => {
        expect(exerciseId).toEqual("test-exercise-id")
        expect(exerciseHistory).toEqual({
          performedWorkoutIds: expect.arrayContaining([expect.any(String)]),
          personalRecords: expect.objectContaining({
            10: expect.arrayContaining([
              {
                datePerformed: expect.any(admin.firestore.Timestamp),
                reps: 10,
                weight: 100,
              },
            ]),
          }),
        })
      })
    })
  })

  describe("ExerciseStore", () => {
    test("updateExerciseSetting() should update exercise settings", async () => {
      const { exerciseStore, userStore } = rootStoreTestUserMain
      await exerciseStore.getAllExercises()
      const exerciseId = exerciseStore.allExercises.keys().next().value
      const exercise = exerciseStore.allExercises.get(exerciseId)!
      expect(exercise.exerciseSettings).toBeUndefined()

      exerciseStore.updateExerciseSetting(exerciseId, "weightUnit", WeightUnit.kg)
      expect(exercise.exerciseSettings?.weightUnit).toEqual(WeightUnit.kg)

      await exerciseStore.uploadExerciseSettings()

      const repositories = testRepositories.get(testUserMainEmail)!
      const { userRepository } = repositories
      const user = await userRepository!.get(userStore.userId)
      expect(user?.preferences?.exerciseSpecificSettings?.[exerciseId]?.weightUnit).toEqual(
        WeightUnit.kg,
      )
    })
  })

  describe("Firebase repositories", () => {
    it("should convert undefined to null before saving to Firestore", async () => {
      const { userStore } = rootStoreTestUserMain
      const userId = userStore.userId
      const repositories = testRepositories.get(testUserMainEmail)!
      const { workoutRepository } = repositories
      const testWorkoutId = "test-workout-id"

      expect(() => workoutRepository!.create(getWorkout("testWorkout1", userId!))).not.toThrow()
      expect(() =>
        workoutRepository!.update(testWorkoutId, {
          activityId: undefined,
        }),
      ).not.toThrow()
    })
  })
})

describe.only("Unit tests", () => {
  describe("Number format utilities", () => {
    it("should format simplified numbers correctly", () => {
      const { simplifyNumber } = require("../app/utils/formatNumber")
      expect(simplifyNumber(-1)).toEqual("-1")
      expect(simplifyNumber(0)).toEqual("0")
      expect(simplifyNumber(1)).toEqual("1")
      expect(simplifyNumber(999)).toEqual("999")
      expect(simplifyNumber(1000)).toEqual("1K")
      expect(simplifyNumber(5100)).toEqual("5.1K")
      expect(simplifyNumber(10000)).toEqual("10K")
      expect(simplifyNumber(500000)).toEqual("500K")
      expect(simplifyNumber(1000000)).toEqual("1M")
      expect(simplifyNumber(9100000)).toEqual("9.1M")
      expect(simplifyNumber(10000000)).toEqual("10M")
      expect(simplifyNumber(100000000)).toEqual("100M")
      expect(simplifyNumber(1000000000)).toEqual("1B")
      expect(simplifyNumber(4200000000)).toEqual("4.2B")
    })
  })
})
