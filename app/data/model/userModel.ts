import { ExerciseSettings } from "./exerciseModel"

export interface IUserPreferences {
  allExerciseSettings?: {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[]
}

export interface IUser {
  email: string
  firstName?: string
  lastName?: string
  userId?: string
  providerId?: string
  photoUrl?: string
  preferences?: IUserPreferences
}

export function isIUser(value: unknown): value is IUser {
  return value && typeof value === "object" && (value as IUser).email !== undefined
}
