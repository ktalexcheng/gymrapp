import { ExerciseSetType, ExerciseSource, ExerciseVolumeType } from "app/data/constants"
import { repositoryFactory } from "app/data/repository"
import * as admin from "firebase-admin"
import { toJS } from "mobx"
import { ExerciseModel } from "../ExerciseStore"
import { SetPerformedModel } from "../models"
import { RootStore, RootStoreModel } from "../RootStore"

describe.skip("WorkoutStore tests", () => {
  let rootStore: RootStore

  beforeAll(async () => {
    // Shared utility should be created to do this before all tests
    const repositories = repositoryFactory(admin.firestore())
    rootStore = RootStoreModel.create({}, repositories)

    const testUserEmail = "john.doe@demo.com"
    const authUser = await admin.auth().getUserByEmail(testUserEmail)
    if (!authUser) {
      throw new Error(`User ${testUserEmail} not found`)
    }

    await rootStore.userStore.loadUserWithId(authUser.uid)
    rootStore.feedStore.setUserId(authUser.uid)
  })

  it("should appropriately label new records when saving a workout", async () => {
    const { activeWorkoutStore } = rootStore
    const activityId = "gym"
    const exercise = ExerciseModel.create({
      exerciseId: "GgialzfipvoFZKcSLPRX",
      volumeType: ExerciseVolumeType.Reps,
      activityName: "Gym",
      exerciseName: "Iso-Lateral Decline Press",
      exerciseSource: ExerciseSource.Public,
      exerciseCat1: "Chest",
      exerciseCat2: "Machine",
      hasLeaderboard: true,
    })
    const set = SetPerformedModel.create({
      setId: "setId",
      setOrder: 0,
      setType: ExerciseSetType.Normal,
      isCompleted: true,
      isNewRecord: false,
      volumeType: ExerciseVolumeType.Reps,
      reps: 8,
      weight: 35,
      rpe: null,
    })

    activeWorkoutStore.resetWorkout()
    activeWorkoutStore.startNewWorkout(activityId)
    activeWorkoutStore.addExercise(exercise)
    activeWorkoutStore.addSet(0, set)
    activeWorkoutStore.exercises.at(0)?.setsPerformed.at(0).setProp("isCompleted", true)
    activeWorkoutStore.endWorkout()
    activeWorkoutStore.saveWorkout(false, toJS(rootStore.userStore.user!), false)
  })
})
