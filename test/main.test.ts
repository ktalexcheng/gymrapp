import { AppLocale, ExerciseSetType, WeightUnit } from "app/data/constants"
import { ExerciseSet, User } from "app/data/model"
import * as admin from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  PrivateExerciseRepository,
  PrivateUserRepository,
  PublicUserRepository,
  WorkoutRepository,
} from "../app/data/repository"
import { RootStore, RootStoreModel } from "../app/stores/RootStore"

describe("Main test suite", () => {
  let firestoreClient: admin.firestore.Firestore
  const maxRetries = 5 // For tests that trigger Firebase Functions, we might need to wait for the function to complete
  const retryDelay = 1000 // ms

  const testUserMainEmail = "jest@test.com"
  const testUser2Email = "jest2@test.com"
  // rootStoreTestUserMain is its own variable simply because it is used often
  let rootStoreTestUserMain: RootStore
  const testUserRootStores = new Map<string, RootStore>()

  const createTestUserAuth = async (email: string) => {
    const userRecord = await admin.auth().createUser({
      email,
      password: "password",
    })
    return userRecord.uid
  }

  const rootStoreFactory = async (firstName, lastName, testUserEmail) => {
    // Setup MST stores
    const rootStore = RootStoreModel.create(
      {},
      {
        privateUserRepository: new PrivateUserRepository(firestoreClient),
        publicUserRepository: new PublicUserRepository(firestoreClient),
        privateExerciseRepository: new PrivateExerciseRepository(firestoreClient),
        activityRepository: new ActivityRepository(firestoreClient),
        exerciseRepository: new ExerciseRepository(firestoreClient),
        workoutRepository: new WorkoutRepository(firestoreClient),
        feedRepository: new FeedRepository(firestoreClient),
      },
    )

    // Create test user
    /**
     * Note: We cannot use the AuthenticationStore to create test users because
     * the @react-native-firebase/auth library is stateful so we will not be able
     * to manage multiple users at the same time. Using the firebase-admin library instead.
     */
    const { userStore } = rootStore
    const testUserId = await createTestUserAuth(testUserEmail)
    await userStore.createNewProfile({
      userId: testUserId,
      firstName,
      lastName,
      email: testUserEmail,
      privateAccount: false,
      providerId: "Jest",
      preferences: {
        appLocale: AppLocale.en_US,
        weightUnit: WeightUnit.kg,
        autoRestTimerEnabled: false,
        restTime: 0,
      },
      exerciseHistory: {},
    })
    await userStore.loadUserWithId(testUserId)
    testUserRootStores.set(testUserEmail, rootStore)

    return rootStore
  }

  const deleteAllDocumentsInCollection = async (collectionPath: string) => {
    const collectionRef = firestoreClient.collection(collectionPath)
    const documents = await collectionRef.listDocuments()
    for (const doc of documents) {
      await doc.delete()
    }
  }

  const testUserCleanup = async (testUserStore: RootStore) => {
    const { userStore } = testUserStore
    const userId = userStore.userId

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId)

    // Delete document in "usersPrivate" collection
    await userStore.deleteProfile()

    // Delete document in "workouts" collection where byUserId == userID
    const workouts = await firestoreClient
      .collection("workouts")
      .where("byUserId", "==", userId)
      .get()
    for (const workoutDoc of workouts.docs) {
      await workoutDoc.ref.delete()
    }

    // Delete documents in "feeds/{userId}/feedItems" collection
    await deleteAllDocumentsInCollection(`feeds/${userId}/feedItems`)

    // Delete documents in "userFollows/{userId}/followers" collection
    await deleteAllDocumentsInCollection(`userFollows/${userId}/followers`)

    // Delete documents in "userFollows/{userId}/followings" collection
    await deleteAllDocumentsInCollection(`userFollows/${userId}/followings`)
  }

  const getUserUsingEmail = async (email: string) => {
    const userSnapshot = await firestoreClient
      .collection("usersPrivate")
      .where("email", "==", email)
      .limit(1)
      .get()

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      return userDoc.data() as User
    }

    return undefined
  }

  const retryExpectAsync = async (expectFn: () => Promise<void>) => {
    let retries = 0
    while (retries < maxRetries - 1) {
      try {
        console.debug(Date.now(), "retryExpectAsync() attempt:", retries)
        await expectFn()
        console.debug(Date.now(), "retryExpectAsync() success")
        return
      } catch (e) {
        retries++
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }

    // Do not wrap last retry in try-catch block to capture failures
    await expectFn()
  }

  beforeEach(async () => {
    // Setup connection to Firebase
    firestoreClient = admin.firestore()

    // Setup MST stores for main test user
    rootStoreTestUserMain = await rootStoreFactory("Jest", "Test", testUserMainEmail)

    // Create other test users
    await rootStoreFactory("Jest 2", "Test", testUser2Email)
  })

  afterEach(async () => {
    // Delete test user and all other test users
    for (const testUserStore of testUserRootStores.values()) {
      await testUserCleanup(testUserStore)
    }
  })

  describe("Integration tests", () => {
    test("When a followee creates a workout, the follower should see it in their feed", async () => {
      // Let the other test user follow the main test user
      const { userStore: userStoreTestUser2 } = testUserRootStores.get(testUser2Email)
      const testUserMain = await getUserUsingEmail(testUserMainEmail)
      await userStoreTestUser2.followUser(testUserMain.userId)

      // Let main test user create a workout
      const { workoutStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise("test-exercise-id")
      workoutStore.addSet(0, {
        setType: ExerciseSetType.Normal,
        weight: 100,
        reps: 10,
        isCompleted: true,
      } as ExerciseSet)
      workoutStore.endWorkout()
      await workoutStore.saveWorkout()

      // Check that the other test user has the workout in their feed
      const { feedStore: feedStoreTestUser2 } = testUserRootStores.get(testUser2Email)
      const expectFeedItems = async () => {
        await feedStoreTestUser2.refreshFeedItems()
        expect(feedStoreTestUser2.feedItems.length).toBe(1)
        expect(feedStoreTestUser2.feedWorkouts.size).toBe(1)
      }

      return retryExpectAsync(expectFeedItems)
    })
  })

  describe("WorkoutStore", () => {
    test("WorkoutStore should manage exercises and sets order correctly", () => {
      const { workoutStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise("test-exercise-id-1")
      workoutStore.addSet(0, {
        setType: ExerciseSetType.Normal,
        weight: 100,
        reps: 10,
        isCompleted: true,
      } as ExerciseSet)
      workoutStore.addSet(0, {
        setType: ExerciseSetType.Normal,
        weight: 200,
        reps: 20,
        isCompleted: true,
      } as ExerciseSet)
      expect(workoutStore.exercises.length).toEqual(1)
      expect(workoutStore.exercises.at(0).setsPerformed.length).toEqual(2)

      workoutStore.removeSet(0, 0)
      expect(workoutStore.exercises.at(0).setsPerformed.length).toEqual(1)
      expect(workoutStore.exercises.at(0).setsPerformed.at(0).setOrder).toEqual(0)

      workoutStore.addExercise("test-exercise-id-2")
      expect(workoutStore.exercises.length).toEqual(2)

      workoutStore.removeExercise(0)
      expect(workoutStore.exercises.length).toEqual(1)
      expect(workoutStore.exercises.at(0).exerciseId).toEqual("test-exercise-id-2")
    })

    test("WorkoutStore.saveWorkout() should create new workout document and update user workoutMetas and exerciseHistory", async () => {
      const { workoutStore } = rootStoreTestUserMain
      workoutStore.startNewWorkout("test")
      workoutStore.addExercise("test-exercise-id")
      workoutStore.addSet(0, {
        setType: ExerciseSetType.Normal,
        weight: 100,
        reps: 10,
        isCompleted: true,
      } as ExerciseSet)
      workoutStore.endWorkout()
      await workoutStore.saveWorkout()

      const userData = await getUserUsingEmail(testUserMainEmail)
      // Check workoutMetas has been updated
      expect(Object.keys(userData.workoutMetas).length).toEqual(1)
      Object.entries(userData.workoutMetas).forEach(([_, workoutMeta]) => {
        expect(workoutMeta).toEqual(
          expect.objectContaining({
            startTime: expect.any(admin.firestore.Timestamp),
          }),
        )
      })

      // Check exerciseHistory has been updated
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

  // describe("ExerciseStore", () => {
  //   test("ExerciseStore.updateExerciseSetting() should update exercise settings", async () => {
  //     const { exerciseStore } = rootStoreTestUserMain

  //     await exerciseStore.getAllExercises()
  //     const exerciseId = exerciseStore.allExercises.keys().next().value
  //     exerciseStore.updateExerciseSetting(exerciseId, "isFavourite", true)
  //     expect(exerciseStore.allExercises.get(exerciseId).exerciseSettings.isFavourite).toEqual(true)
  //   }
  // })
})
