import { DefaultUserPreferences } from "app/data/constants"
import { ExerciseId, ExerciseSettings } from "app/data/types"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

/**
 * Get the value of an exercise setting, falling back to the user's preference, and then the default
 * @param exerciseId
 * @param settingName
 * @returns Setting value
 */
export const useExerciseSetting = <T>(
  exerciseId: ExerciseId,
  settingName: keyof ExerciseSettings,
): [settingValue: T] => {
  const { exerciseStore, userStore } = useStores()

  const exerciseSpecificSetting =
    exerciseStore.getExercise(exerciseId)?.exerciseSettings?.[settingName]
  const userPreference = userStore.getUserPreference(settingName)
  const defaultSetting = DefaultUserPreferences[settingName]
  const settingValue = exerciseSpecificSetting ?? userPreference ?? defaultSetting

  const [exerciseSetting, setExerciseSetting] = useState<any>(settingValue)

  useEffect(() => {
    setExerciseSetting(settingValue)
    console.debug("useExerciseSetting", {
      exerciseId,
      settingName,
      exerciseSpecificSetting,
      userPreference,
    })
  }, [settingValue])

  return [exerciseSetting]
}
