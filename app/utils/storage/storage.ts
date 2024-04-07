import AsyncStorage from "@react-native-async-storage/async-storage"

const storageKeys = {
  CURRENT_USER_ID_STORAGE_KEY: "userId",
  BUILD_VERSION_STORAGE_KEY: "build-version",
  ROOT_STATE_STORAGE_KEY: "root-v1",
  NAVIGATION_PERSISTENT_STORAGE_KEY: "NAVIGATION_STATE",
}

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export async function loadString(key: keyof typeof storageKeys): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(storageKeys[key])
  } catch {
    // not sure why this would fail... even reading the RN docs I'm unclear
    return null
  }
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function saveString(key: keyof typeof storageKeys, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(storageKeys[key], value)
    return true
  } catch {
    return false
  }
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export async function load(key: keyof typeof storageKeys): Promise<unknown | null> {
  try {
    const almostThere = await AsyncStorage.getItem(storageKeys[key])
    if (!almostThere) return null
    return JSON.parse(almostThere)
  } catch {
    return null
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function save(key: keyof typeof storageKeys, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(storageKeys[key], JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export async function remove(key: keyof typeof storageKeys): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKeys[key])
  } catch {}
}

/**
 * Burn it all to the ground.
 */
export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear()
  } catch {}
}
