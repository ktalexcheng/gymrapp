import { types } from "mobx-state-tree"

export function snapshotToType<T>(value: string): T {
  if (value) {
    const obj = JSON.parse(value)
    return {
      ...obj,
    } as T
  } else {
    return undefined
  }
}

export function typeToSnapshot<T>(value: T): string {
  if (value) {
    return JSON.stringify(value)
  } else {
    return undefined
  }
}

export function createCustomType<T>(typeName: string, isT: (value: unknown) => boolean) {
  return types.custom<any, T>({
    name: typeName,
    fromSnapshot(value: string) {
      return snapshotToType<T>(value)
    },
    toSnapshot(value: T) {
      return typeToSnapshot<T>(value)
    },
    isTargetType(value: any) {
      return isT(value)
    },
    getValidationMessage(value: any) {
      if (isT(value) || value === undefined) return ""
      return `"${value}" does not look like a ${typeName} type`
    },
  })
}
