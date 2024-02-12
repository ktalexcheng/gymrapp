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
  const defaultSetting = DefaultUserPreferences[settingName]
  const { exerciseStore, userStore } = useStores()
  const [exerciseSetting, setExerciseSetting] = useState<any>(defaultSetting)
  // In order to get the observable value from the MST store,
  // we need to access the field directly and not through a getter
  // Update: I'm not sure this is true
  const exerciseSpecificSetting =
    exerciseStore.getExercise(exerciseId)?.exerciseSettings?.[settingName]
  const userPreference = userStore.getUserPreference(settingName)

  useEffect(() => {
    const setting = exerciseSpecificSetting ?? userPreference ?? defaultSetting
    setExerciseSetting(setting)
    // console.debug(
    //   "useExerciseSetting exerciseId:",
    //   exerciseId,
    //   "; settingName:",
    //   settingName,
    //   "; exerciseSpecificSetting:",
    //   exerciseSpecificSetting,
    //   "; userPreference:",
    //   userPreference,
    // )
  }, [exerciseSpecificSetting, userPreference])

  return [exerciseSetting]
}
