import { Exercise, ExerciseId } from "../model"
import { BaseRepository } from "./baseRepository"

// export class ExerciseRepository implements BaseRepository<Exercise> {
//   _collectionName = "exercises"
//   _firestoreClient: FirebaseFirestoreTypes.Module

//   constructor(firebaseClient) {
//     this._firestoreClient = firebaseClient
//   }

//   get(): Promise<Exercise> {
//     throw new Error("Method not implemented.")
//   }

//   async create(newExercise: NewExercise): Promise<void> {
//     const exercisesCollection = this._firestoreClient.collection(this._collectionName)

//     await exercisesCollection
//       .add(newExercise)
//       .catch((e) => console.error("ExerciseRepository.create error:", e))
//   }

//   updateById(): Promise<void> {
//     throw new Error("Method not implemented.")
//   }

//   delete(): Promise<void> {
//     throw new Error("Method not implemented.")
//   }

//   async getMany(): Promise<Exercise[] | null> {
//     const exercisesCollection = this._firestoreClient.collection(this._collectionName)
//     const exercisesSnapshot = await exercisesCollection.get()

//     if (exercisesSnapshot.empty) return null

//     const exercises: Exercise[] = []
//     console.debug(
//       "ExerciseRepository.getMany exercisesSnapshot.docs.length:",
//       exercisesSnapshot.docs.length,
//     )
//     const _exercises = {}
//     exercisesSnapshot.forEach((e) => {
//       const exercise = e.data()
//       if (!(exercise.exerciseName in _exercises)) _exercises[exercise.exerciseName] = [e.id]
//       else _exercises[exercise.exerciseName].push(e.id)

//       exercises.push(<Exercise>{
//         exerciseSource: "Public",
//         exerciseId: e.id,
//         activityName: exercise.activityName,
//         exerciseCat1: exercise.exerciseCat1,
//         exerciseCat2: exercise.exerciseCat2,
//         exerciseName: exercise.exerciseName,
//       })
//     })
//     console.debug("ExerciseRepository.getMany _exercises:", _exercises)

//     return exercises
//   }
// }

export class ExerciseRepository extends BaseRepository<Exercise, ExerciseId> {
  constructor(firebaseClient) {
    super("ExerciseRepository", firebaseClient, "exercises", "exerciseId")
  }
}
