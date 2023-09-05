import { ExerciseSetType } from "app/data/constants"
import { ExerciseSet, User } from "app/data/model"
import * as admin from "firebase-admin"
import {
  ActivityRepository,
  ExerciseRepository,
  FeedRepository,
  PrivateUserRepository,
  PublicUserRepository,
  WorkoutRepository,
} from "../app/data/repository"
import { RootStore, RootStoreModel } from "../app/stores/RootStore"

describe("Main test suite", () => {
  let rootStore: RootStore
  let firestoreClient: admin.firestore.Firestore
  const testUserEmail = "jest@test.com"

  beforeEach(async () => {
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

    // Create test user
    const { authenticationStore: authStore, userStore } = rootStore
    authStore.setLoginEmail(testUserEmail)
    authStore.setLoginPassword("password")
    authStore.setNewFirstName("Jest")
    authStore.setNewLastName("Test")
    await authStore.signUpWithEmail()
    await userStore.loadUserWithId(authStore.userId)
  })

  afterEach(async () => {
    // Delete test user
    const { authenticationStore: authStore, userStore } = rootStore
    await authStore.deleteAccount()
    await userStore.invalidateSession()
  })

  const getTestUserSnapshotData = async () => {
    const userSnapshot = await firestoreClient
      .collection("usersPrivate")
      .where("email", "==", testUserEmail)
      .limit(1)
      .get()

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      return userDoc.data() as User
    }

    return undefined
  }

  describe("FeedStore", () => {
    test("FeedStore.refreshFeedItems() should fetch feed items", async () => {
      const { feedStore, userStore } = rootStore
      // Get user ID
      const testUser = await getTestUserSnapshotData()
      await userStore.loadUserWithId(testUser.userId)

      await feedStore.refreshFeedItems()
      expect(feedStore.feedItems.length).toBeGreaterThan(0)
      expect(feedStore.feedItems.length).toBeLessThanOrEqual(50)
      expect(feedStore.feedWorkouts.size).toBeGreaterThan(0)
      expect(feedStore.feedWorkouts.size).toBeLessThanOrEqual(50)
    })
  })

  describe("WorkoutStore", () => {
    test.only("WorkoutStore should manage exercises and sets order correctly", () => {
      const { workoutStore } = rootStore
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
      const { workoutStore } = rootStore
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

      const userData = await getTestUserSnapshotData()
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
})
