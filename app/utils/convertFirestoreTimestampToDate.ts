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
      data[key] = (data[key] as FirebaseFirestoreTypes.Timestamp).toDate()
    } else {
      data[key] = convertFirestoreTimestampToDate(data[key])
    }
  }

  return data
}
