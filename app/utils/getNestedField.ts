/**
 * Get the nested field value from an object or map
 * @param obj Object to get the nested field from
 * @param fieldPath Path to the nested field in dot-notation, e.g. "user.preferences.restTime"
 * @returns Value of the nested field, or undefined if the field does not exist
 */
export const getNestedField = (obj: object | Map<any, any>, fieldPath: string) => {
  const keys = fieldPath.split(".")
  let field = obj
  for (const key of keys) {
    if (field === null || field === undefined) {
      return undefined
    }

    if (field instanceof Map) {
      if (field.has(key)) {
        field = field.get(key)
      } else {
        return undefined
      }
    } else if (field instanceof Object) {
      if (key in field) {
        field = field[key]
      } else {
        return undefined
      }
    } else {
      console.warn("getNestedField: field is not an object or map", { obj, fieldPath, field })
      return undefined
    }
  }

  return field
}
