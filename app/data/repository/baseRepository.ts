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
type CacheData<T> = { timestamp: number } & (CacheDataSingle<T> | CacheDataMany<T>)
interface RepositoryCache<T> extends Map<string, CacheData<T>> {}

export class BaseRepository<T, D> implements IBaseRepository<T, D> {
  #repositoryId: string
  #firestoreClient: FirebaseFirestoreTypes.Module
  #collectionPath: string
  #firestoreCollection: FirebaseFirestoreTypes.CollectionReference
  #documentIdField: string
  #fieldNameMap?: { [key: string]: string }
  #cache: RepositoryCache<T> = new Map()
  #cacheLifespan = 1000 * 60 * 5 // 5 minutes in milliseconds
  #getAllCacheKey = "getAll"

  constructor(
    repositoryId: string,
    firestoreClient: FirebaseFirestoreTypes.Module,
    collectionPath: string,
    documentIdField: string,
    fieldNameMap?: { [key: string]: string },
  ) {
    this.#repositoryId = repositoryId
    this.#firestoreClient = firestoreClient
    this.#collectionPath = collectionPath
    this.#documentIdField = documentIdField
    this.#firestoreCollection = this.#firestoreClient.collection(this.#collectionPath)

    if (fieldNameMap && documentIdField in fieldNameMap) {
      throw new RepositoryError(
        this.#repositoryId,
        `Document ID field ${documentIdField} cannot be renamed in fieldNameMap`,
      )
    }
    this.#fieldNameMap = fieldNameMap
  }

  setCollectionPath(collectionPath: string) {
    this.#collectionPath = collectionPath
    this.#firestoreCollection = this.#firestoreClient.collection(collectionPath)
  }

  _renameFields(data: any, map: { [key: string]: string }): any {
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

  _sourceToRepRename(data: any): any {
    this._renameFields(data, this.#fieldNameMap)
  }

  _repToSourceRename(data: any): any {
    const reversedFieldNameMap = Object.keys(this.#fieldNameMap).reduce((acc, key) => {
      acc[this.#fieldNameMap[key]] = key
      return acc
    }, {})

    this._renameFields(data, reversedFieldNameMap)
  }

  /**
   * Rename data fields if a fieldNameMap is provided, convert firestore Timestamp to JS Date, and include document ID in the data object
   * @param {FirebaseFirestoreTypes.DocumentSnapshot} snapshot Document snapshot from firestore
   * @returns {T} Data object with renamed fields, firestore Timestamp converted to JS Date, and document ID included
   */
  _processDocumentSnapshot<T>(snapshot: FirebaseFirestoreTypes.DocumentSnapshot): T {
    const data = snapshot.data()

    // Rename data fields if a fieldNameMap is provided
    const renamedData = this.#fieldNameMap ? this._sourceToRepRename(data) : data

    // If a data field type is firestore's Timestamp, perform .toDate() on it
    // to convert it to a JS Date object
    // Note: Simpler condition (renamedData[key] instanceof firestore.Timestamp) not used
    // because it does not work with firebase-admin for testing purposes
    for (const key in renamedData) {
      if (
        Object.prototype.toString.call(renamedData[key]) === "[object Object]" &&
        "toDate" in renamedData[key]
      ) {
        renamedData[key] = (renamedData[key] as FirebaseFirestoreTypes.Timestamp).toDate()
      }
    }

    // Include document ID in the data object
    const renamedDataWithId = { ...renamedData, [this.#documentIdField]: snapshot.id }

    return renamedDataWithId
  }

  _setCacheData(cacheKey: string, cacheData: CacheData<T>) {
    this.#cache.set(cacheKey, cacheData)
  }

  getCacheData(cacheKey: string): CacheData<T> {
    if (this.#cache.has(cacheKey)) {
      const cacheData = this.#cache.get(cacheKey)

      // TODO: Never invalidate cache for now so the condition is always true,
      // but we should implement a way to invalidate cache based on a timestamp
      // e.g. cacheData.timestamp.getTime() + this.#cacheLifespan > new Date.now()
      if (cacheData.timestamp + this.#cacheLifespan > 0) {
        return cacheData
      }
    }

    return null
  }

  get repositoryId(): string {
    return this.#repositoryId
  }

  get firestoreClient(): FirebaseFirestoreTypes.Module {
    return this.#firestoreClient
  }

  async createCacheKeyFromString(s: string): Promise<string> {
    return await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.MD5, s)
  }

  async get(id: D, refresh = false): Promise<T> {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for get() method")
    }

    const cacheKey = id as string
    if (!refresh) {
      const cacheData = this.getCacheData(cacheKey)
      if (cacheData) return cacheData.data as T
    }

    try {
      const snapshot = await this.#firestoreCollection.doc(id as string).get()
      if (!snapshot.exists) return null

      const data = this._processDocumentSnapshot<T>(snapshot)

      this._setCacheData(cacheKey, {
        timestamp: Date.now(),
        data,
        type: CacheDataType.Single,
      })
      return data
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error getting document by ID: ${e}`)
    }
  }

  async getByFilter(
    orderByField: string | FirebaseFirestoreTypes.FieldPath,
    orderDirection: "asc" | "desc",
    limit: number,
    afterFieldValue?: string | FirebaseFirestoreTypes.FieldPath,
    beforeFieldValue?: string | FirebaseFirestoreTypes.FieldPath,
  ): Promise<T[]> {
    if (!orderByField || !limit) {
      throw new RepositoryError(
        this.#repositoryId,
        "sortBy and limit must be provided for getByFilter() method",
      )
    }

    const query = this.#firestoreCollection.orderBy(orderByField, orderDirection).limit(limit)
    if (afterFieldValue) {
      query.startAfter(afterFieldValue)
    }
    if (beforeFieldValue) {
      query.endBefore(beforeFieldValue)
    }

    try {
      const snapshot = await query.get()
      const allData: T[] = []
      snapshot.forEach((doc) => {
        const data = this._processDocumentSnapshot<T>(doc)
        allData.push(data)
      })

      return allData
    } catch (e) {
      throw new RepositoryError(this.#repositoryId, `Error getting documents by filter: ${e}`)
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
    const query = this.#firestoreCollection
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
      throw new RepositoryError(this.#repositoryId, `Error getting documents by IDs: ${e}`)
    }

    const allData: T[] = []
    if (querySnapshots.length) {
      querySnapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const data = this._processDocumentSnapshot<T>(doc)
          allData.push(data)
        })
      })
    }

    this._setCacheData(cacheKey, {
      timestamp: Date.now(),
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
    let docId = null
    if (this.#documentIdField in data) {
      docId = data[this.#documentIdField]
    }

    const renamedData = this.#fieldNameMap ? this._repToSourceRename(data) : data
    try {
      let newDocRef: FirebaseFirestoreTypes.DocumentReference = null
      if (docId) {
        newDocRef = this.#firestoreCollection.doc(docId)
        await newDocRef.set(renamedData)
      } else {
        newDocRef = await this.#firestoreCollection.add(renamedData)
        docId = newDocRef.id
      }

      this._setCacheData(docId, {
        timestamp: Date.now(),
        data: {
          [this.#documentIdField]: docId,
          ...data,
        } as T,
        type: CacheDataType.Single,
      })
      return newDocRef.id as D
    } catch (e) {
      console.error("Error creating document with data:", { data, renamedData })
      throw new RepositoryError(this.#repositoryId, `Error creating document: ${e}`)
    }
  }

  async update(id: D, data: Partial<T>, useSetMerge = false): Promise<void> {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for update() method")
    }

    const renamedData = this.#fieldNameMap ? this._repToSourceRename(data) : data
    try {
      const docRef = this.#firestoreCollection.doc(id as string)

      if (useSetMerge) {
        await docRef.set(renamedData, { merge: true })
      } else {
        await docRef.update(renamedData)
      }

      const snapshot = await docRef.get()
      const data = this._processDocumentSnapshot<T>(snapshot)
      this._setCacheData(id as string, {
        timestamp: Date.now(),
        data,
        type: CacheDataType.Single,
      })
    } catch (e) {
      console.error("Error updating document with data:", { data, renamedData })
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
