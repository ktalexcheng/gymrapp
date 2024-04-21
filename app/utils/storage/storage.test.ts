import AsyncStorage from "@react-native-async-storage/async-storage"
import { clear, load, loadString, remove, save, saveString } from "./storage"

// fixtures
const VALUE_OBJECT = { x: 1 }
const VALUE_STRING = JSON.stringify(VALUE_OBJECT)

beforeEach(() => (AsyncStorage.getItem as jest.Mock).mockReturnValue(Promise.resolve(VALUE_STRING)))
afterEach(() => jest.clearAllMocks())

test("load", async () => {
  const value = await load("CURRENT_USER_ID_STORAGE_KEY")
  expect(value).toEqual(JSON.parse(VALUE_STRING))
})

test("loadString", async () => {
  const value = await loadString("CURRENT_USER_ID_STORAGE_KEY")
  expect(value).toEqual(VALUE_STRING)
})

test("save", async () => {
  await save("CURRENT_USER_ID_STORAGE_KEY", VALUE_OBJECT)
  expect(AsyncStorage.setItem).toHaveBeenCalledWith("CURRENT_USER_ID_STORAGE_KEY", VALUE_STRING)
})

test("saveString", async () => {
  await saveString("CURRENT_USER_ID_STORAGE_KEY", VALUE_STRING)
  expect(AsyncStorage.setItem).toHaveBeenCalledWith("CURRENT_USER_ID_STORAGE_KEY", VALUE_STRING)
})

test("remove", async () => {
  await remove("CURRENT_USER_ID_STORAGE_KEY")
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith("CURRENT_USER_ID_STORAGE_KEY")
})

test("clear", async () => {
  await clear()
  expect(AsyncStorage.clear).toHaveBeenCalledWith()
})
