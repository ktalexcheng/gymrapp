import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { storage } from "app/services"
import { logError } from "app/utils/logger"
import { Workout, WorkoutId } from "../types/workout.types"
import { BaseRepository } from "./baseRepository"

export class WorkoutRepository extends BaseRepository<Workout, WorkoutId> {
  LOCAL_WORKOUTS_LIST_KEY = "local-workouts-list"
  LOCAL_WORKOUT_KEY_PREFIX = "local-workout-"

  constructor(firebaseClient) {
    super("WorkoutRepository", firebaseClient, "workouts", "workoutId")
  }

  // This will run a transaction to save the workout and update user document.
  // When offline, the workout will be saved to local storage and will be synced later.
  async saveWorkout(workout: Workout, isOffline: boolean): Promise<boolean> {
    this.checkRepositoryInitialized()

    // Prepare the workout to be saved
    const workoutId = workout.workoutId
    const convertedWorkout = this._processDataForFirestore(workout)
    // const renamedWorkout = this._sourceToRepRename(convertedWorkout)
    convertedWorkout._createdAt = firestore.FieldValue.serverTimestamp()
    convertedWorkout._modifiedAt = firestore.FieldValue.serverTimestamp()

    // Prepare the user document updates
    const userUpdate = {
      [`workoutMetas.${workoutId}.startTime`]: workout.startTime,
    } as any
    workout?.exercises?.forEach((e) => {
      const volumeType = e.volumeType

      userUpdate[`exerciseHistory.${e.exerciseId}.performedWorkoutIds`] =
        firestore.FieldValue.arrayUnion(workoutId)
      if (e.newRecords && Object.keys(e.newRecords).length > 0) {
        Object.entries(e.newRecords).forEach(([rep, record]) => {
          const newRecord = firestore.FieldValue.arrayUnion({ ...record, workoutId, volumeType })
          userUpdate[`exerciseHistory.${e.exerciseId}.personalRecords.${rep}`] = newRecord
        })
      }
    })

    // Document references
    const newWorkoutRef = this.firestoreCollection!.doc(workoutId)
    const userDocRef = this.firestoreClient!.collection("users").doc(workout.byUserId)

    const txUpdateFunction = async (tx: FirebaseFirestoreTypes.Transaction) => {
      tx.set(newWorkoutRef, convertedWorkout)
      tx.update(userDocRef, userUpdate)
    }

    if (!isOffline) {
      try {
        await this.firestoreClient.runTransaction(txUpdateFunction)
        return true
      } catch (e) {
        logError(e, "WorkoutRepository.saveWorkout error")
      }
    }

    // Always fallback to saving locally
    await this.saveWorkoutLocally(convertedWorkout)
    return false
  }

  // This assume the workout is already
  async saveWorkoutLocally(workout: Workout): Promise<void> {
    const localWorkoutKey = this.LOCAL_WORKOUT_KEY_PREFIX + workout.workoutId
    const localTimestamp = new Date()

    await storage.storeData(localWorkoutKey, {
      ...workout,
      _createdAt: localTimestamp,
      _modifiedAt: localTimestamp,
      __isLocalOnly: true,
    })

    const localWorkoutsList = await storage.getData(this.LOCAL_WORKOUTS_LIST_KEY)
    const localWorkoutKeys = localWorkoutsList || []
    localWorkoutKeys.push(workout.workoutId)
    await storage.storeData(this.LOCAL_WORKOUTS_LIST_KEY, localWorkoutKeys)
  }

  async getAllLocalWorkouts(): Promise<Workout[]> {
    const localWorkoutsList = await storage.getData(this.LOCAL_WORKOUTS_LIST_KEY)
    console.debug("workoutRepository.getAllLocalWorkouts", { localWorkoutsList })
    if (!localWorkoutsList) return []

    const localWorkouts = await Promise.all(
      localWorkoutsList.map(async (workoutId) => {
        const localWorkoutKey = this.LOCAL_WORKOUT_KEY_PREFIX + workoutId
        return await storage.getData(localWorkoutKey)
      }),
    )

    return localWorkouts
  }

  async uploadAllLocalWorkouts(): Promise<string[]> {
    const localWorkouts = await this.getAllLocalWorkouts()
    console.debug("workoutRepository.uploadAllLocalWorkouts", { localWorkouts })
    if (!localWorkouts) return []

    const uploadedWorkoutIds: string[] = []
    await Promise.all(
      localWorkouts.map((workout) =>
        this.saveWorkout(workout, false).then(() => uploadedWorkoutIds.push(workout.workoutId)),
      ),
    )

    // Clear local storage
    await storage.deleteData(this.LOCAL_WORKOUTS_LIST_KEY)
    await Promise.all(
      localWorkouts.map(async (workout) => {
        const localWorkoutKey = this.LOCAL_WORKOUT_KEY_PREFIX + workout.workoutId
        await storage.deleteData(localWorkoutKey)
      }),
    )

    return uploadedWorkoutIds
  }
}
