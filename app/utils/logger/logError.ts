import crashlytics from "@react-native-firebase/crashlytics"

export async function logError(error: any, message?: any, ...optionalParams: any[]) {
  crashlytics().log(`${message} ${JSON.stringify(optionalParams)}`)
  crashlytics().recordError(error)
  console.error(message, error, ...optionalParams)
}
