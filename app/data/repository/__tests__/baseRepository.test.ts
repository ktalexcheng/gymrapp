import { BaseRepository } from "../baseRepository"

describe("BaseRepository", () => {
  describe("_processDataForFirestore", () => {
    it("should convert all undefined values to null in the data object", () => {
      const baseRepository = new BaseRepository<any, any>("repositoryId", {} as any, null, "id")
      const nowDate = new Date()
      const mapData = new Map()
      mapData.set("mapField1", "mapValue1")
      mapData.set("mapField2", 5)
      mapData.set("mapField3", false)
      mapData.set("mapField4", { objField1: "objValue1" })
      mapData.set("mapField5", ["arrValue1"])
      const nestedMapData = new Map()
      nestedMapData.set("nestedMapField1", "nestedMapValue1")
      mapData.set("mapField6", nestedMapData)
      mapData.set("mapField7", nowDate)
      const data = {
        __isLocalOnly: true,
        profile: {
          name: "John",
          nowDate,
          mapData,
          age: undefined,
        },
        address: {
          street: "123 Main St",
          city: undefined,
        },
        active: false,
      }
      const expectedData = {
        profile: {
          name: "John",
          nowDate,
          mapData,
          age: null, // undefined converted to null
        },
        address: {
          street: "123 Main St",
          city: null, // undefined converted to null
        },
        active: false,
      }

      const processedData = baseRepository._processDataForFirestore(data)
      expect(processedData).toStrictEqual(expectedData)

      processedData._createdAt = null // Doing this should not change the data object
      expect(data).not.toHaveProperty("_createdAt")
    })
  })
})
