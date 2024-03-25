import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
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
  create(data: Partial<T>): Promise<void>
  update(id: D, data: Partial<T>, useSetMerge: boolean): Promise<T>
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

type FirebaseCollectionType =
  FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentReference>
type FirebaseSnapshotType =
  FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
type FirebaseDocumentReferenceType =
  FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>
type FirebaseQueryType = FirebaseFirestoreTypes.QuerySnapshot<FirebaseDocumentReferenceType>

interface FilterOptions {
  orderByField?: keyof FirebaseDocumentReferenceType | FirebaseFirestoreTypes.FieldPath
  orderDirection?: "asc" | "desc"
  limit?: number
  afterValue?: string | FirebaseFirestoreTypes.FieldPath
  beforeValue?: string | FirebaseFirestoreTypes.FieldPath
  whereConditions?: [
    keyof FirebaseDocumentReferenceType | FirebaseFirestoreTypes.FieldPath,
    FirebaseFirestoreTypes.WhereFilterOp,
    any,
  ][]
}

// Note: Removing the field rename feature for now, adds complexity and not sure if it's needed
export class BaseRepository<T extends FirebaseFirestoreTypes.DocumentData, D extends string> {
  #repositoryId: string
  #firestoreClient: FirebaseFirestoreTypes.Module
  #firestoreCollection?: FirebaseCollectionType
  #documentIdField: keyof T
  // #fieldNameMap?: { [key: string]: string }
  #cache: RepositoryCache<T> = new Map()
  #cacheLifespan = 1000 * 60 * 5 // 5 minutes in milliseconds
  #getAllCacheKey = "getAll"
  #repositoryInitialized = false

  constructor(
    repositoryId: string,
    firestoreClient: FirebaseFirestoreTypes.Module,
    collectionPath: string | null,
    documentIdField: keyof T,
    // fieldNameMap?: { [key: string]: string },
  ) {
    // if (fieldNameMap && documentIdField in fieldNameMap) {
    //   throw new RepositoryError(
    //     repositoryId,
    //     `Document ID field ${String(documentIdField)} cannot be renamed in fieldNameMap`,
    //   )
    // }

    // this.#fieldNameMap = fieldNameMap
    this.#repositoryId = repositoryId
    this.#firestoreClient = firestoreClient
    this.#documentIdField = documentIdField

    // The collection path could be late-bound and left empty at construction time
    if (collectionPath) {
      this.setCollectionPath(collectionPath)
    }
  }

  checkRepositoryInitialized() {
    if (!this.#repositoryInitialized || !this.#firestoreCollection) {
      throw new RepositoryError(
        this.#repositoryId,
        "Repository not initialized. If collection path is late-bound, call setCollectionPath() before using repository methods.",
      )
    }
  }

  setCollectionPath(collectionPath?: string) {
    if (!collectionPath) {
      this.#firestoreCollection = undefined
      this.#repositoryInitialized = false
    } else {
      this.#firestoreCollection = this.#firestoreClient.collection(collectionPath)
      this.#repositoryInitialized = true
    }
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

  // _sourceToRepRename(data: any): any {
  //   if (!this.#fieldNameMap) return data

  //   const renamed = this._renameFields(data, this.#fieldNameMap)
  //   renamed?.__isLocalOnly && delete renamed.__isLocalOnly

  //   return renamed
  // }

  // _repToSourceRename(data: any): any {
  //   if (!this.#fieldNameMap) return data

  //   const reversedFieldNameMap = Object.keys(this.#fieldNameMap).reduce((acc, key) => {
  //     const value = this.#fieldNameMap?.[key]
  //     if (value) acc[value] = key
  //     return acc
  //   }, {})

  //   return this._renameFields(data, reversedFieldNameMap)
  // }

  /**
   * Rename data fields if a fieldNameMap is provided, convert firestore Timestamp to JS Date, and include document ID in the data object
   * @param {FirebaseFirestoreTypes.DocumentSnapshot} snapshot Document snapshot from firestore
   * @returns {T} Data object with renamed fields, firestore Timestamp converted to JS Date, and document ID included
   */
  _processDocumentSnapshot(snapshot: FirebaseSnapshotType): T {
    const data = snapshot.data()

    // Rename data fields if a fieldNameMap is provided
    // const renamedData = this.#fieldNameMap ? this._sourceToRepRename(data) : data
    const processedData = convertFirestoreTimestampToDate(data)

    // Include document ID in the data object
    const processedDataWithId = { ...processedData, [this.#documentIdField]: snapshot.id }

    return processedDataWithId
  }

  // If the data is an object, recursively convert all undefined values to null then return a deep copy
  _processDataForFirestore(data: any): any {
    // Coerce undefined values to null
    if (data === undefined || data === null) return null

    const objProto = Object.getPrototypeOf(data)
    // The accumulator will be used to create a copy of the data to prevent mutating the original
    let accumulator: any
    switch (objProto) {
      case Object.prototype:
        accumulator = {}
        for (const key in data) {
          if (key === "__isLocalOnly") continue // This is a special field for local data
          accumulator[key] = this._processDataForFirestore(data[key])
        }

        return accumulator
      case Map.prototype:
        accumulator = new Map()
        for (const [key, value] of data.entries()) {
          if (key === "__isLocalOnly") continue // This is a special field for local data
          accumulator.set(key, this._processDataForFirestore(value))
        }

        return accumulator
      case Array.prototype:
        accumulator = []
        for (const key in data) {
          accumulator[key] = this._processDataForFirestore(data[key])
        }

        return accumulator
      default:
        return data
    }
  }

  _setCacheData(cacheKey: string, cacheData: CacheData<T>) {
    this.#cache.set(cacheKey, cacheData)
  }

  getCacheData(cacheKey: string): CacheData<T> | undefined {
    if (this.#cache.has(cacheKey)) {
      const cacheData = this.#cache.get(cacheKey)

      // Never invalidate cache during dev
      if (cacheData && Date.now() - cacheData.timestamp < this.#cacheLifespan) {
        return cacheData
      }
    }

    return undefined
  }

  get repositoryId(): string {
    return this.#repositoryId
  }

  get firestoreClient(): FirebaseFirestoreTypes.Module {
    return this.#firestoreClient
  }

  get firestoreCollection(): FirebaseFirestoreTypes.CollectionReference | undefined {
    return this.#firestoreCollection
  }

  async createCacheKeyFromString(s: string): Promise<string> {
    return await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.MD5, s)
  }

  async checkDocumentExists(id: D): Promise<boolean> {
    this.checkRepositoryInitialized()

    if (!id) {
      throw new RepositoryError(
        this.#repositoryId,
        "No document ID provided for checkDocumentExists() method",
      )
    }

    try {
      const snapshot = await this.#firestoreCollection!.doc(id as string).get()
      return snapshot.exists
    } catch (e) {
      console.error("Error checking if document exists:", { id })
      throw new RepositoryError(this.#repositoryId, `Error checking if document exists: ${e}`)
    }
  }

  newDocumentId() {
    return this.#firestoreCollection!.doc().id
  }

  async get(id: D, refresh = true): Promise<T | undefined> {
    this.checkRepositoryInitialized()

    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for get() method")
    }

    const cacheKey = id as string
    if (!refresh) {
      const cacheData = this.getCacheData(cacheKey)
      if (cacheData) return cacheData.data as T
    }

    try {
      const snapshot = await this.#firestoreCollection!.doc(id as string).get()
      if (!snapshot.exists) return undefined

      const data = this._processDocumentSnapshot(snapshot)

      this._setCacheData(cacheKey, {
        timestamp: Date.now(),
        data,
        type: CacheDataType.Single,
      })
      return data
    } catch (e) {
      console.error("Error getting document by ID:", { id, refresh })
      throw new RepositoryError(this.#repositoryId, `Error getting document by ID: ${e}`)
    }
  }

  async getByFilter(options: FilterOptions): Promise<T[]> {
    const {
      orderByField,
      orderDirection,
      limit = 20,
      afterValue,
      beforeValue,
      whereConditions,
    } = options
    this.checkRepositoryInitialized()

    // if (!orderByField && !limit && (!afterFieldValue || !beforeFieldValue) && !whereConditions) {
    //   throw new RepositoryError(
    //     this.#repositoryId,
    //     'At least one filter condition must be provided for getByFilter() method'
    //   );
    // }

    // Always default to a limit of 10 to prevent accidental large queries
    let query = this.#firestoreCollection!.limit(limit)
    if (orderByField) {
      const direction = orderDirection ?? "asc"
      query = query
        .orderBy(orderByField, direction)
        .orderBy(firestore.FieldPath.documentId(), direction)
    }
    if (afterValue) {
      query = query.startAfter(afterValue)
    }
    if (beforeValue) {
      query = query.endBefore(beforeValue)
    }
    if (whereConditions) {
      for (const whereCond of whereConditions) {
        query = query.where(...whereCond)
      }
    }

    try {
      const snapshot = await query.get()
      const allData: T[] = []
      snapshot.forEach((doc) => {
        const data = this._processDocumentSnapshot(doc)
        allData.push(data)
      })

      return allData
    } catch (e) {
      console.error("Error getting document by filter:", {
        orderByField,
        orderDirection,
        limit,
        afterValue,
        beforeValue,
      })
      throw new RepositoryError(this.#repositoryId, `Error getting documents by filter: ${e}`)
    }
  }

  // TODO: Might be a more efficient way of doing this?
  // Maybe individual queries for each ID (to leverage cache) and then merge the results?
  async getMany(ids?: D[], refresh = true): Promise<T[]> {
    this.checkRepositoryInitialized()

    let cacheKey = this.#getAllCacheKey
    if (ids && ids.length > 0) {
      const sortedIds = ids.sort()
      cacheKey = await this.createCacheKeyFromString(sortedIds.join(","))
    }
    if (!refresh) {
      const cacheData = this.getCacheData(cacheKey)
      if (cacheData) return cacheData.data as T[]
    }

    const querySnapshots: FirebaseQueryType[] = []
    const query = this.#firestoreCollection!
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
      console.error("Error getting document by IDs:", {
        ids,
        refresh,
      })
      throw new RepositoryError(this.#repositoryId, `Error getting documents by IDs: ${e}`)
    }

    const allData: T[] = []
    if (querySnapshots.length) {
      querySnapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const data = this._processDocumentSnapshot(doc)
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

  async create(data: Partial<T>, isOffline = false): Promise<void> {
    this.checkRepositoryInitialized()

    if (!data) {
      throw new RepositoryError(this.#repositoryId, "No data provided for create() method")
    }

    // If document id is included in data, use set() instead of add()
    let docId
    if (this.#documentIdField in data) {
      docId = data[this.#documentIdField]
    }

    const convertedData = this._processDataForFirestore(data)
    // const renamedData = this.#fieldNameMap ? this._repToSourceRename(convertedData) : convertedData
    // Stamp _createdAt and _modifiedAt to all data created
    convertedData._createdAt = firestore.FieldValue.serverTimestamp()
    convertedData._modifiedAt = firestore.FieldValue.serverTimestamp()

    // Get a new document reference if no document ID is provided
    let newDocRef: FirebaseFirestoreTypes.DocumentReference
    if (docId) {
      newDocRef = this.#firestoreCollection!.doc(docId)
    } else {
      newDocRef = this.#firestoreCollection!.doc()
      docId = newDocRef.id
    }

    // Firestore rules may prohibit get() on a document that doesn't exist
    // e.g. `allow read: if request.auth.uid == resource.data.byUserId;`
    // If get() fails, we can only assume the document doesn't exist
    // and rely on allow create rules to prevent overwriting existing documents
    // belonging to other users
    try {
      const newDoc = await newDocRef.get({ source: isOffline ? "cache" : "default" })
      if (newDoc.exists) {
        throw new RepositoryError(
          this.#repositoryId,
          `Document with ID ${docId} already exists, cannot create new document with same ID`,
        )
      }
    } catch {}

    try {
      // Create the document, if offline, do not wait for the promise to resolve, the document
      // will be persisted locally and synced by Firebase later
      if (isOffline)
        newDocRef.set({ [this.#documentIdField]: docId, ...convertedData }).then(() => {
          console.debug(
            `${this.#repositoryId} Repository: Document with ID ${docId} synced to Firestore`,
          )
        })
      else await newDocRef.set({ [this.#documentIdField]: docId, ...convertedData })
    } catch (e) {
      console.error("Error creating document with data:", { data, convertedData })
      throw new RepositoryError(this.#repositoryId, `Error creating document: ${e}`)
    }

    // try {
    //   // This extra read is required so we can get the document with server-side information
    //   // e.g. the resolved value for firestore.FieldValue.serverTimestamp()
    //   // IMPORTANT: The read from cache will error if the document has not been retrieved with a get() from the server first
    //   // i.e. If we set() a new document and then immediately get() it, it will error
    //   console.debug(
    //     "firestore.FieldValue.serverTimestamp()",
    //     firestore.FieldValue.serverTimestamp(),
    //   )
    //   const newDocSnapshot = await newDocRef.get({ source: offline ? "cache" : "default" })
    //   const newDocData = this._processDocumentSnapshot(newDocSnapshot)

    //   const cacheData = {
    //     [this.#documentIdField]: docId,
    //     ...newDocData,
    //   } as T
    //   this._setCacheData(docId, {
    //     timestamp: Date.now(),
    //     data: cacheData,
    //     type: CacheDataType.Single,
    //   })

    //   return cacheData
    // } catch (e) {
    //   console.error(`Error getting the newly created document ${docId}: ${e}`)
    //   throw new RepositoryError(
    //     this.#repositoryId,
    //     `Error getting the newly created document ${docId}: ${e}`,
    //   )
    // }
  }

  async update(
    id: D,
    data: { [P in keyof T]?: T[P] | FirebaseFirestoreTypes.FieldValue | null },
    useSetMerge = false,
    isOffline = false,
  ): Promise<T> {
    this.checkRepositoryInitialized()

    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for update() method")
    }

    const convertedData = this._processDataForFirestore(data)
    // const renamedData = this.#fieldNameMap ? this._repToSourceRename(convertedData) : convertedData
    // Update _modifiedAt timestamp to all data updated
    convertedData._modifiedAt = firestore.FieldValue.serverTimestamp()
    try {
      const docRef = this.#firestoreCollection!.doc(id as string)

      // Update document, if offline, do not wait for the promise to resolve, the document
      // will be persisted locally and synced by Firebase later
      if (useSetMerge) {
        if (isOffline) docRef.set(convertedData, { merge: true })
        else await docRef.set(convertedData, { merge: true })
      } else {
        // When using update() method, if the document doesn't exist, it will throw an error
        // before sure to check if the document exists first
        if (isOffline) docRef.update(convertedData)
        else await docRef.update(convertedData)
      }

      const snapshot = await docRef.get()
      const snapshotData = this._processDocumentSnapshot(snapshot)
      this._setCacheData(id as string, {
        timestamp: Date.now(),
        data: snapshotData,
        type: CacheDataType.Single,
      })

      return snapshotData
    } catch (e) {
      console.error("Error updating document with data:", { id, useSetMerge, data, convertedData })
      throw new RepositoryError(this.#repositoryId, `Error updating document: ${e}`)
    }
  }

  async upsert(
    id: D,
    data: { [P in keyof T]?: T[P] | FirebaseFirestoreTypes.FieldValue | null },
  ): Promise<T> {
    const docExists = this.checkDocumentExists(id)

    // Using FieldValue will fail for create() methods
    // for compatibility, always create if doc does not exist then update
    if (!docExists) {
      await this.create({ [this.#documentIdField]: id } as Partial<T>)
    }

    return await this.update(id, data)
  }

  async delete(id: D): Promise<void> {
    this.checkRepositoryInitialized()

    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for delete() method")
    }

    try {
      await this.#firestoreCollection!.doc(id as string).delete()
    } catch (e) {
      console.error("Error deleting document:", { id })
      throw new RepositoryError(this.#repositoryId, `Error deleting document: ${e}`)
    }
  }

  subscribeToCollection(
    callback: (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => void,
  ): () => void {
    this.checkRepositoryInitialized()

    return this.#firestoreCollection!.onSnapshot(callback)
  }

  subscribeToDocument(
    documentId: D,
    callback: (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => void,
  ): () => void {
    this.checkRepositoryInitialized()

    return this.#firestoreCollection!.doc(documentId).onSnapshot(callback)
  }

  clearAllCache() {
    this.#cache.clear()
  }
}
