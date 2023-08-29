import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import * as crypto from "expo-crypto"

export class RepositoryError extends Error {
  constructor(repositoryId, message) {
    super(message)
    this.name = `${repositoryId} RepositoryError`
  }
}

// This interface specifies the methods that all repositories must implement
// Where T is the type of the document and D is the type alias for the document id
export interface IBaseRepository<T, D> {
  get(id: D, refresh?: boolean): Promise<T>
  getMany(ids?: D[], refresh?: boolean): Promise<T[]>
  create(data: Partial<T>): Promise<D>
  update(id: D, data: Partial<T>, useSetMerge: boolean): Promise<void>
  delete(id: D): Promise<void>
}

// RepositoryCache is a generic interface for the cache object
// that contains the data and the timestamp of the last update
enum CacheDataType {
  Single = "single",
  Many = "many",
}
type CacheDataSingle<T> = {
  data: T
  type: CacheDataType.Single
}
type CacheDataMany<T> = {
  data: T[]
  type: CacheDataType.Many
}
type CacheData<T> = { timestamp: Date } & (CacheDataSingle<T> | CacheDataMany<T>)
interface RepositoryCache<T> extends Map<string, CacheData<T>> {}

export class BaseRepository<T, D> implements IBaseRepository<T, D> {
  #repositoryId: string
  #firestoreClient: FirebaseFirestoreTypes.Module
  #collectionName: string
  #firestoreCollection: FirebaseFirestoreTypes.CollectionReference
  #documentIdField: string
  #fieldNameMap?: { [key: string]: string }
  #cache: RepositoryCache<T> = new Map()
  #cacheLifespan = 1000 * 60 * 5 // 5 minutes in milliseconds
  #getAllCacheKey = "getAll"

  constructor(
    repositoryId: string,
    firestoreClient: FirebaseFirestoreTypes.Module,
    collectionName: string,
    documentIdField: string,
    fieldNameMap?: { [key: string]: string },
  ) {
    this.#repositoryId = repositoryId
    this.#firestoreClient = firestoreClient
    this.#collectionName = collectionName
    this.#documentIdField = documentIdField
    this.#firestoreCollection = this.#firestoreClient.collection(this.#collectionName)

    if (fieldNameMap && documentIdField in fieldNameMap) {
      throw new RepositoryError(
        this.#repositoryId,
        `Document ID field ${documentIdField} cannot be renamed in fieldNameMap`,
      )
    }
    this.#fieldNameMap = fieldNameMap
  }

  #renameFields(data: any, map: { [key: string]: string }): any {
    const renamedData = {}
    for (const key in data) {
      if (key in map) {
        renamedData[map[key]] = data[key]
      } else {
        renamedData[key] = data[key]
      }
    }

    return renamedData
  }

  #sourceToRepRename(data: any): any {
    this.#renameFields(data, this.#fieldNameMap)
  }

  #repToSourceRename(data: any): any {
    const reversedFieldNameMap = Object.keys(this.#fieldNameMap).reduce((acc, key) => {
      acc[this.#fieldNameMap[key]] = key
      return acc
    }, {})

    this.#renameFields(data, reversedFieldNameMap)
  }

  getCacheData(cacheKey: string): CacheData<T> {
    if (this.#cache.has(cacheKey)) {
      const cacheData = this.#cache.get(cacheKey)

      if (cacheData.timestamp.getTime() + this.#cacheLifespan > Date.now()) {
        return cacheData
      }
    }

    return null
  }

  #setCacheData(cacheKey: string, cacheData: CacheData<T>) {
    this.#cache.set(cacheKey, cacheData)
  }

  async createCacheKeyFromString(s: string): Promise<string> {
    return await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.MD5, s)
  }

  async get(id: D, refresh = false): Promise<T> {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for get() method")
    }

    const cacheKey = await this.createCacheKeyFromString(id as string)
    if (!refresh) {
      const cacheData = this.getCacheData(cacheKey)
      if (cacheData) return cacheData.data as T
    }

    try {
      const snapshot = await this.#firestoreCollection.doc(id as string).get()
      if (!snapshot.exists) return null

      const data = snapshot.data() as T
      const renamedData = this.#fieldNameMap ? this.#sourceToRepRename(data) : data
      const renamedDataWithId = { ...renamedData, [this.#documentIdField]: snapshot.id }

      this.#setCacheData(cacheKey, {
        timestamp: new Date(),
        data: renamedDataWithId,
        type: CacheDataType.Single,
      })
      return renamedDataWithId
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error getting document by ID: ${e}`)
    }
  }

  async getMany(ids?: D[], refresh = false): Promise<T[]> {
    let cacheKey = this.#getAllCacheKey
    if (ids && ids.length > 0) {
      const sortedIds = ids ? ids.sort() : null
      cacheKey = await this.createCacheKeyFromString(sortedIds.join(","))
    }
    if (!refresh) {
      const cacheData = this.getCacheData(cacheKey)
      if (cacheData) return cacheData.data as T[]
    }

    const querySnapshots: FirebaseFirestoreTypes.QuerySnapshot[] = []
    const query = this.#firestoreClient.collection(this.#collectionName)
    try {
      if (ids && ids.length > 0) {
        while (ids.length) {
          // Firestore only allows 10 items in an "in" query
          const batchIds = ids.splice(0, 10)
          const snapshot = await query
            .where(firestore.FieldPath.documentId(), "in", [...batchIds])
            .get()

          querySnapshots.push(snapshot)
        }
      } else {
        const snapshot = await query.get()
        querySnapshots.push(snapshot)
      }
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error getting documents by filter: ${e}`)
    }

    const allData: T[] = []
    if (querySnapshots.length) {
      querySnapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const _data = doc.data() as T
          const _renamedData = this.#fieldNameMap ? this.#sourceToRepRename(_data) : _data

          allData.push({
            ..._renamedData,
            [this.#documentIdField]: doc.id,
          } as T)
        })
      })
    }

    this.#setCacheData(cacheKey, {
      timestamp: new Date(),
      data: allData,
      type: CacheDataType.Many,
    })
    return allData
  }

  async create(data: Partial<T>): Promise<D> {
    if (!data) {
      throw new RepositoryError(this.#repositoryId, "No data provided for create() method")
    }

    // If document id is included in data, use set() instead of add()
    let docIdAssigned = false
    if (this.#documentIdField in data) {
      docIdAssigned = true
    }

    const renamedData = this.#fieldNameMap ? this.#repToSourceRename(data) : data
    try {
      let newDocRef: FirebaseFirestoreTypes.DocumentReference = null
      if (docIdAssigned) {
        newDocRef = this.#firestoreCollection.doc(data[this.#documentIdField] as string)
        await newDocRef.set(renamedData)
      } else {
        newDocRef = await this.#firestoreCollection.add(renamedData)
      }

      return newDocRef.id as D
    } catch (e) {
      console.error("something", { data, renamedData })
      throw new RepositoryError(this.#repositoryId, `Error creating document: ${e}`)
    }
  }

  async update(id: D, data: Partial<T>, useSetMerge = false): Promise<void> {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for update() method")
    }

    try {
      const renamedData = this.#fieldNameMap ? this.#repToSourceRename(data) : data
      const docRef = this.#firestoreCollection.doc(id as string)

      if (useSetMerge) {
        await docRef.set(renamedData, { merge: true })
      } else {
        await docRef.update(renamedData)
      }
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error updating document: ${e}`)
    }
  }

  async delete(id: D): Promise<void> {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for delete() method")
    }

    try {
      await this.#firestoreCollection.doc(id as string).delete()
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error deleting document: ${e}`)
    }
  }
}
