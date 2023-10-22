import { AppLocale, WeightUnit } from "app/data/constants"
import * as admin from "firebase-admin"

export const createNewUser = async (
  rootStore,
  email: string,
  firstName: string,
  lastName: string,
) => {
  const userRecord = await admin.auth().createUser({
    email,
    password: "password",
  })

  const { userStore } = rootStore
  await userStore.createNewProfile({
    userId: userRecord.uid,
    firstName,
    lastName,
    email,
    privateAccount: false,
    providerId: "Jest",
    preferences: {
      appLocale: AppLocale.en_US,
      weightUnit: WeightUnit.kg,
      autoRestTimerEnabled: false,
      restTime: 0,
    },
    exerciseHistory: {},
    myGyms: [],
  })
  await userStore.loadUserWithId(userRecord.uid)
}
