import AsyncStorage from "@react-native-async-storage/async-storage"

const APP_LAST_UPDATED_KEY = "GYMRAPP_APP_LAST_UPDATED"

export class Storage {
  #storeData = async (key, value) => {
    try {
      if (value instanceof Object) {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
      } else {
        await AsyncStorage.setItem(key, value)
      }
    } catch (e) {
      throw new Error("Error storing data: " + e)
    }
  }

  #getData = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key)
      return value
    } catch (e) {
      throw new Error("Error getting data: " + e)
    }
  }

  setAppLastUpdated = async () => {
    try {
      await this.#storeData(APP_LAST_UPDATED_KEY, new Date().getTime().toString())
    } catch (e) {
      throw new Error("Error setting app last updated time: " + e)
    }
  }

  getAppLastUpdated = async (): Promise<number | null> => {
    try {
      const value = await this.#getData(APP_LAST_UPDATED_KEY)
      if (!value) return null
      return parseInt(value)
    } catch (e) {
      throw new Error("Error getting app last updated time: " + e)
    }
  }
}

export const storage = new Storage()
