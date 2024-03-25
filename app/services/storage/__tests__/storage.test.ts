import { Storage } from ".."

describe("Storage", () => {
  let storage: Storage

  beforeEach(() => {
    storage = new Storage()
  })

  it("should store and retrieve data", async () => {
    const key = "test-key"
    const value = "test-value"

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toBe(value)
  })

  it("should store and retrieve object data", async () => {
    const key = "test-key"
    const value = { test: "test-value" }

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toEqual(value)
  })

  it("should store and retrieve object data with dates", async () => {
    const key = "test-key"
    const value = { test: new Date() }

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toEqual(value)
  })

  it("should store and retrieve nested object data with dates", async () => {
    const key = "test-key"
    const value = { test: { nested: new Date() } }

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toEqual(value)
  })

  it("should store and retrieve nested array data with dates", async () => {
    const key = "test-key"
    const value = { test: [new Date()] }

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toEqual(value)
  })

  it("should store and retrieve complex object with primitives and dates", async () => {
    const key = "test-key"
    const value = {
      field1: new Date(),
      field2: [new Date()],
      field3: {
        key1: [new Date(), "string", 0, false],
      },
      field4: true,
      field5: 0,
      field6: "string",
    }

    await storage.storeData(key, value)

    const retrievedValue = await storage.getData(key)
    expect(retrievedValue).toEqual(value)
  })
})
