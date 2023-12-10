import { ExerciseId, ExerciseSettings } from "app/data/model"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

export const useExerciseSetting = <T>(
  exerciseId: ExerciseId,
  settingName: keyof ExerciseSettings,
): [settingValue: T] => {
  const { exerciseStore, userStore } = useStores()
  const [exerciseSetting, setExerciseSetting] = useState<any>()
  // In order to get the observable value from the MST store,
  // we need to access the field directly and not through a getter
  const exerciseSpecificSetting =
    exerciseStore.getExercise(exerciseId)?.exerciseSettings?.[settingName]
  const userPreference = userStore.getUserPreference(settingName)

  useEffect(() => {
    const setting = exerciseSpecificSetting ?? userPreference
    setExerciseSetting(setting)
    console.debug(
      "useExerciseSetting exerciseId:",
      exerciseId,
      "; settingName:",
      settingName,
      "; exerciseSpecificSetting:",
      exerciseSpecificSetting,
      "; userPreference:",
      userPreference,
    )
  }, [exerciseSpecificSetting, userPreference])

  return [exerciseSetting]
}
