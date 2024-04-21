import { repositoryFactory } from "app/data/repository"
import { User, Workout } from "app/data/types"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import * as admin from "firebase-admin"
import { toJS } from "mobx"
import { RootStore, RootStoreModel } from "../RootStore"

describe("WorkoutStore tests", () => {
  let rootStore: RootStore

  beforeAll(() => {
    // Shared utility should be created to do this before all tests
    const repositories = repositoryFactory(admin.firestore())
    rootStore = RootStoreModel.create({}, repositories)
  })

  it.only("should clear user's exerciseHistory and rewrite all workouts to recreate it", async () => {
    const rewriteUserWorkouts = async (userSnapshot: User) => {
      const { userStore, workoutEditorStore } = rootStore
      userStore.setUserFromFirebase(userSnapshot)

      const firestore = admin.firestore()
      const allWorkouts = await firestore
        .collection("workouts")
        .where("byUserId", "==", userStore.userId)
        .orderBy("startTime", "asc")
        .get()
      if (allWorkouts.empty) {
        console.debug(`No workouts found for user ${userStore.userId}, skipping`)
        return
      }

      console.debug("Processing workouts from user", {
        userId: userStore.userId,
        displayName: userStore.displayName,
      })
      for (const doc of allWorkouts.docs) {
        let workoutData = doc.data() as Workout
        workoutData = convertFirestoreTimestampToDate(workoutData)
        // workoutData = convertWorkoutToMSTSnapshot(workoutData)
        if (!workoutData.exercises.length) {
          console.debug(`Workout ${doc.id} has no exercises, skipping`)
          continue
        }

        const isHidden = workoutData.isHidden
        workoutEditorStore.resetWorkout()
        workoutEditorStore.hydrateWithWorkout(workoutData)
        await workoutEditorStore.updateWorkout(isHidden, toJS(userStore.user), true, false)

        // Refresh user snapshot
        const updatedUserDoc = await firestore.collection("users").doc(userStore.userId!).get()
        userStore.setUserFromFirebase(updatedUserDoc.data() as User)

        console.debug("Updated workout", doc.id, "for user", userStore.userId)
      }
    }

    const firestore = admin.firestore()

    // Check workout counts
    let allWorkouts = await firestore.collection("workouts").get()
    const allWorkoutsCountBefore = allWorkouts.size

    const userColl = firestore.collection("users")
    const allUsersSnapshot = await userColl.get()
    const allUsers = allUsersSnapshot.docs.map((doc) => doc.data() as User)
    let userWorkoutsMetaCountBefore = 0
    for (const user of allUsers) {
      userWorkoutsMetaCountBefore = user.workoutMetas ? Object.keys(user.workoutMetas).length : 0
      await userColl.doc(user.userId).update({
        exerciseHistory: {},
      })
      await rewriteUserWorkouts(user)

      const userSnapshot = await userColl.doc(user.userId).get()
      const updatedUser = userSnapshot.data() as User
      const userWorkoutsMetaCountAfter = updatedUser.workoutMetas
        ? Object.keys(updatedUser.workoutMetas).length
        : 0
      expect(userWorkoutsMetaCountAfter).toBe(userWorkoutsMetaCountBefore)
    }

    // Check final workout counts are the same
    allWorkouts = await firestore.collection("workouts").get()
    const allWorkoutsCountAfter = allWorkouts.size
    expect(allWorkoutsCountAfter).toBe(allWorkoutsCountBefore)
  })
})
