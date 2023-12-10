import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"

export const convertFirestoreTimestampToDate = (data: any): any => {
  if (!(data instanceof Object)) {
    return data
  }

  for (const key in data) {
    // Skip if data field is not an object
    if (!(data[key] instanceof Object)) {
      continue
    }

    if ("toDate" in data[key] && typeof data[key].toDate === "function") {
      // Data type expected from the react-native-firebase client
      data[key] = (data[key] as FirebaseFirestoreTypes.Timestamp).toDate()
    } else if ("_seconds" in data[key] && "_nanoseconds" in data[key]) {
      // Data type expected from the firebase functions
      data[key] = new Date(data[key]._seconds * 1000)
    } else {
      data[key] = convertFirestoreTimestampToDate(data[key])
    }
  }

  return data
}
