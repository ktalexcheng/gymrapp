import { Activity, ActivityId } from "../model/activityModel"
import { BaseRepository } from "./baseRepository"

// export class ActivityRepository implements BaseRepository<Activity> {
//   _collectionName = "activities"
//   _firestoreClient: FirebaseFirestoreTypes.Module

//   constructor(firebaseClient) {
//     this._firestoreClient = firebaseClient
//   }

//   get(): Promise<Activity> {
//     throw new Error("Method not implemented.")
//   }

//   async getMany(): Promise<Activity[] | null> {
//     const activityCollection = this._firestoreClient.collection(this._collectionName)
//     const activitySnapshot = await activityCollection.get()

//     if (activitySnapshot.empty) return null

//     const activities: Activity[] = []
//     activitySnapshot.forEach((e) => {
//       activities.push({
//         activityId: e.id,
//         ...e.data(),
//       } as Activity)
//     })

//     return activities
//   }

//   create(): Promise<any> {
//     throw new Error("Method not implemented.")
//   }

//   updateById(): Promise<any> {
//     throw new Error("Method not implemented.")
//   }

//   delete(): Promise<any> {
//     throw new Error("Method not implemented.")
//   }
// }

export class ActivityRepository extends BaseRepository<Activity, ActivityId> {
  constructor(firebaseClient) {
    super("ActivityRepository", firebaseClient, "activities", "activityId")
  }
}
