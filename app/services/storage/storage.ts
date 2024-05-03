import AsyncStorage from "@react-native-async-storage/async-storage"

// This helps us manage the keys we use for AsyncStorage and share them across the app
export const storageKeys = {
  APP_LAST_UPDATED: "gymrapp-app-last-updated",
  CURRENT_USER_ID: "user-id",
  BUILD_VERSION: "build-version",
  ROOT_STORE_STATE: "root-v1",
  MAIN_NAVIGATOR_STATE: "navigation-state",
  APP_LOCALE: "app-locale",
}

export class Storage {
  convertDateStringToDate(data: any) {
    if (!(data instanceof Object)) {
      return data
    }

    for (const key in data) {
      // Only attempt to convert string to date if it's a string
      if (typeof data[key] !== "string") {
        data[key] = this.convertDateStringToDate(data[key])
        continue
      }

      const tryDate = new Date(data[key])
      if (tryDate instanceof Date && !isNaN(tryDate.getTime())) {
        data[key] = tryDate
        continue
      }
    }

    return data
  }

  async storeData(key, value) {
    try {
      if (value instanceof Object) {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
      } else {
        await AsyncStorage.setItem(key, value)
      }
    } catch (e) {
      throw new Error("Error storing object: " + e)
    }
  }

  async getData(key, asString = false) {
    let value
    try {
      value = await AsyncStorage.getItem(key)
    } catch (e) {
      throw new Error("Error getting object: " + e)
    }

    if (asString) {
      return value
    }

    let parsedValue
    try {
      parsedValue = JSON.parse(value)
      parsedValue = this.convertDateStringToDate(parsedValue)
      return parsedValue
    } catch (e) {
      console.warn("Unable to parse as JSON string, returning as is: " + value)
      return value
    }
  }

  async deleteData(key) {
    try {
      await AsyncStorage.removeItem(key)
    } catch (e) {
      throw new Error("Error deleting object: " + e)
    }
  }

  async clearAllData() {
    try {
      await AsyncStorage.clear()
    } catch (e) {
      throw new Error("Error clearing all data: " + e)
    }
  }

  async setAppLastUpdated() {
    try {
      await this.storeData(storageKeys.APP_LAST_UPDATED, new Date().getTime().toString())
    } catch (e) {
      throw new Error("Error setting app last updated time: " + e)
    }
  }

  async getAppLastUpdated(): Promise<number | null> {
    try {
      const value = await this.getData(storageKeys.APP_LAST_UPDATED)
      if (!value) return null
      return parseInt(value)
    } catch (e) {
      throw new Error("Error getting app last updated time: " + e)
    }
  }
}

export const storage = new Storage()
