import Constants from "expo-constants"

function getGoogleClientId() {
  const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId

  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE CLIENT ID is missing.")
  }

  return GOOGLE_CLIENT_ID
}

export const Env = {
  GOOGLE_CLIENT_ID: getGoogleClientId(),
}
