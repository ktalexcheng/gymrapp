import * as firestore from "@google-cloud/firestore"
import { ExerciseSetType } from "../../app/data/constants"
import { RootStore } from "../../app/stores/RootStore"
import { readCSV } from "./readCSV"

interface StrongExportDatum {
  Date: Date
  "Workout Name": string
  "Exercise Name": string
  "Set Order": string
  Weight: number
  "Weight Unit": string
  Reps: number
  RPE: number
  Distance: number
  "Distance Unit": string
  Seconds: number
  Notes: string
  "Workout Notes": string
  "Workout Duration": string
}

export async function createWorkoutsFromStrongExport(
  firestoreClient: firestore.Firestore,
  rootStore: RootStore,
  csvPath: string,
  byUserEmail: string,
) {
  // Get user ID
  const userSnapshot = await firestoreClient
    .collection("users")
    .where("email", "==", byUserEmail)
    .limit(1)
    .get()
  const userId = userSnapshot.docs[0].id
  rootStore.userStore.loadUserWithId(userId)

  // Get activity ID
  const activitySnapshot = await firestoreClient
    .collection("activities")
    .where("activityName", "==", "Gym")
    .limit(1)
    .get()
  const gymActivityId = activitySnapshot.docs[0].id

  // Read exported data from Strong
  const csvData = await readCSV<StrongExportDatum>(csvPath, ";")

  // Keep track of exercises seen what is missing in our collection
  const missingExercises = new Set()
  const existingExerciseIds = {}

  // Convert data and write to Firestore
  const { workoutStore } = rootStore
  workoutStore.resetWorkout()
  workoutStore.startNewWorkout(gymActivityId)
  let _dateState = null
  let _exerciseIdState = null
  let _exerciseOrderState = null
  for (let i = 0; i < csvData.length; i++) {
    const d = csvData[i]

    // Check for exercise in DB
    const _exerciseName = d["Exercise Name"]
    if (!missingExercises.has(_exerciseName) && !(_exerciseName in existingExerciseIds)) {
      const exerciseSnapshot = await firestoreClient
        .collection("exercises")
        .where("exerciseName", "==", _exerciseName)
        .limit(1)
        .get()
      if (exerciseSnapshot.empty) {
        missingExercises.add(_exerciseName)
      } else {
        existingExerciseIds[_exerciseName] = exerciseSnapshot.docs[0].id
      }
    }

    // Only deal with existing exercises
    if (_exerciseName in existingExerciseIds) {
      if (!_dateState) _dateState = d.Date

      if (_exerciseIdState !== existingExerciseIds[_exerciseName]) {
        _exerciseIdState = existingExerciseIds[_exerciseName]
        workoutStore.addExercise(_exerciseIdState)
        _exerciseOrderState = workoutStore.exercises.length - 1
      }

      workoutStore.addSet(_exerciseOrderState, {
        setType: ExerciseSetType.Normal,
      })
      const _setOrder = workoutStore.exercises.at(_exerciseOrderState).setsPerformed.length - 1
      const _set = workoutStore.exercises.at(_exerciseOrderState).setsPerformed[_setOrder]
      _set.updateSetValues("weight", d.Weight ?? 0)
      _set.updateSetValues("reps", d.Reps)
      _set.updateSetValues("rpe", d.RPE)
      _set.setProp("isCompleted", true)
    }

    // Push if it is the last observation for the current date group
    if (_dateState && _dateState !== csvData[i + 1]?.Date) {
      // console.debug("saving workout:", _dateState)
      workoutStore.setProp("startTime", new Date(d.Date))
      workoutStore.setProp("endTime", new Date(d.Date))
      workoutStore.setProp("workoutTitle", d["Workout Name"])
      workoutStore.endWorkout()
      await workoutStore.saveWorkout()
      workoutStore.resetWorkout()
      _dateState = null
      _exerciseIdState = null
      _exerciseOrderState = null
    }
  }

  console.debug(missingExercises)
  console.debug(existingExerciseIds)
}
