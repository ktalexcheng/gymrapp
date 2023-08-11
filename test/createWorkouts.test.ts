import firestore from "@react-native-firebase/firestore"
import { parse } from "csv-parse"
import * as admin from "firebase-admin"
import * as fs from "fs"
import { types } from "mobx-state-tree"
import * as path from "path"
import { ExerciseSetType } from "../app/data/model"
import {
  ActivityRepository,
  ExerciseRepository,
  UserRepository,
  WorkoutRepository,
} from "../app/data/repository"
import { UserStoreModel } from "../app/stores/UserStore"
import { WorkoutStoreModel } from "../app/stores/WorkoutStore"

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

/**
 * Reads data from CSV file and returns an array of objects
 * @param {string} filePath Path to CSV file
 * @param {string} delimiter Delimiter used in the CSV file
 * @return {T[]} Array of objects of type T
 */
async function readCSV<T>(filePath: string, delimiter: string): Promise<T[]> {
  // headers will map column name to the column index
  const headers: Map<string, number> = new Map()
  const result: T[] = []
  let lineNum = 1

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(parse({ delimiter, from_line: 1 }))
      .on("data", function (row: string[]) {
        if (lineNum === 1) {
          row.forEach((h, i) => headers.set(h, i))
        } else {
          const _rowData: { [key: string]: any } = {}
          headers.forEach((columnNum, columnName) => {
            _rowData[columnName] = row[columnNum]
          })

          result.push(_rowData as T)
        }

        lineNum += 1
      })
      .on("end", function () {
        resolve(result)
      })
      .on("error", function (error) {
        reject(error.message)
      })
  })
}

/**
 *
 * @param {string} csvPath Path to CSV file exported from Strong
 */
async function createExercisesFromStrongExport(csvPath: string) {
  // Setup connection to Firebase
  admin.initializeApp()
  const db = admin.firestore()

  // Get user ID
  const userSnapshot = await db
    .collection("users")
    .where("email", "==", "user@test.com")
    .limit(1)
    .get()
  const userId = userSnapshot.docs[0].id

  // Get activity ID
  const activitySnapshot = await db
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

  // Set up MST stores
  const rootStore = types
    .model("RootStore")
    .props({
      userStore: types.optional(UserStoreModel, {}),
      workoutStore: types.optional(WorkoutStoreModel, {}),
    })
    .create(
      {},
      {
        userRepository: new UserRepository(db),
        activityRepository: new ActivityRepository(db),
        exerciseRepository: new ExerciseRepository(db),
        workoutRepository: new WorkoutRepository(db),
      },
    )
  // const rootStore = useStores()
  const { workoutStore, userStore } = rootStore
  await userStore.loadUserWithId(userId)

  // Convert data and write to Firestore
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
      const exerciseSnapshot = await db
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
      const _setOrder = workoutStore.exercises[_exerciseOrderState].setsPerformed.length - 1
      const _set = workoutStore.exercises[_exerciseOrderState].setsPerformed[_setOrder]
      _set.updateSetValues("weight", d.Weight.toString())
      _set.updateSetValues("reps", d.Reps.toString())
      _set.updateSetValues("rpe", d.RPE.toString())
      _set.setProp("isCompleted", true)
    }

    // Push if it is the last observation for the current date group
    if (_dateState && _dateState !== csvData[i + 1]?.Date) {
      console.debug("saving workout:", _dateState)
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

jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter")

jest
  .spyOn(firestore.FieldValue, "arrayUnion")
  .mockImplementation(admin.firestore.FieldValue.arrayUnion)
jest
  .spyOn(firestore.FieldPath, "documentId")
  .mockImplementation(admin.firestore.FieldPath.documentId)

describe("Create sample workouts", () => {
  test("Create sample workouts", async () => {
    await createExercisesFromStrongExport("data/sample_workouts.csv")
  })
})
