import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { logError } from "app/utils/logger"

type FirebaseCollectionType =
  FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>
type FirebaseSnapshotType =
  FirebaseFirestoreTypes.DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
type FirebaseQueryType = FirebaseFirestoreTypes.QuerySnapshot<FirebaseFirestoreTypes.DocumentData>

interface FilterOptions {
  whereConditions?: [
    string | number | FirebaseFirestoreTypes.FieldPath,
    FirebaseFirestoreTypes.WhereFilterOp,
    any,
  ][]
  limit?: number
  orderBy?: {
    field: string | number | FirebaseFirestoreTypes.FieldPath
    direction: "asc" | "desc"
  }[]
  afterSnapshot?: FirebaseSnapshotType
}

class RepositoryError extends Error {
  constructor(repositoryId, message) {
    super(message)
    this.name = `${repositoryId} RepositoryError`
  }
}

// This interface specifies the methods that all repositories must implement
// Where T is the type of the document and D is the type alias for the document id
interface IBaseRepositoryV2<T, D> {
  checkDocumentExists(id: D): Promise<boolean>
  newDocumentId(): string
  get(id: D): Promise<T | undefined>
  getByFilter(options: FilterOptions): Promise<T[]>
  getMany(ids?: D[]): Promise<T[]>
  create(data: Partial<T>): Promise<void>
  update(id: D, data: Partial<T>, useSetMerge: boolean): Promise<T>
  upsert(id: D, data: Partial<T>): Promise<T>
  delete(id: D): Promise<void>
  subscribeToCollection(callback: (snapshot: FirebaseQueryType) => void): () => void
  subscribeToDocument(id: D, callback: (snapshot: FirebaseSnapshotType) => void): () => void
}

// This is the base repository class that should handle all the common Firestore operations
// We don't worry about caching here and let @tanstack/react-query handle that
export class BaseRepositoryV2<T extends FirebaseFirestoreTypes.DocumentData, D extends string>
  implements IBaseRepositoryV2<T, D>
{
  #repositoryId: string
  #firestoreClient: FirebaseFirestoreTypes.Module
  #firestoreCollection: FirebaseCollectionType
  #documentIdField: keyof T

  constructor(
    repositoryId: string,
    firestoreClient: FirebaseFirestoreTypes.Module,
    collectionPath: string,
    documentIdField: keyof T,
  ) {
    this.#repositoryId = repositoryId
    this.#firestoreClient = firestoreClient
    this.#firestoreCollection = this.#firestoreClient.collection(collectionPath)
    this.#documentIdField = documentIdField
  }

  /**
   * Rename data fields if a fieldNameMap is provided, convert firestore Timestamp to JS Date, and include document ID in the data object
   * @param {FirebaseFirestoreTypes.DocumentSnapshot} snapshot Document snapshot from firestore
   * @returns {T} Data object with renamed fields, firestore Timestamp converted to JS Date, and document ID included
   */
  _processDocumentSnapshot(snapshot: FirebaseSnapshotType): T {
    const data = snapshot.data()

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

  async checkDocumentExists(id: D) {
    if (!id) {
      throw new RepositoryError(
        this.#repositoryId,
        "No document ID provided for checkDocumentExists() method",
      )
    }

    try {
      const snapshot = await this.#firestoreCollection.doc(id as string).get()
      return snapshot.exists
    } catch (e) {
      logError(e, "Error checking if document exists:", { id })
      throw new RepositoryError(this.#repositoryId, `Error checking if document exists: ${e}`)
    }
  }

  newDocumentId() {
    return this.#firestoreCollection.doc().id
  }

  async get(id: D) {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for get() method")
    }

    try {
      const snapshot = await this.#firestoreCollection.doc(id as string).get()
      if (!snapshot.exists) return undefined

      const data = this._processDocumentSnapshot(snapshot)

      return data
    } catch (e) {
      logError(e, "Error getting document by ID:", { id })
      throw new RepositoryError(this.#repositoryId, `Error getting document by ID: ${e}`)
    }
  }

  async getByFilter(options: FilterOptions) {
    const { whereConditions, limit = 20, orderBy, afterSnapshot } = options

    // Always default to a limit of 20 to prevent accidental large queries
    let query = this.#firestoreCollection.limit(limit)
    if (whereConditions) {
      for (const whereCond of whereConditions) {
        query = query.where(...whereCond)
      }
    }
    if (orderBy) {
      for (const o of orderBy) {
        query = query.orderBy(o.field, o.direction)
      }
    }
    if (afterSnapshot) {
      query = query.startAfter(afterSnapshot)
    }

    try {
      const snapshot = await query.get()
      const ids: D[] = []
      const docData: T[] = []
      snapshot.forEach((doc) => {
        const data = this._processDocumentSnapshot(doc) as any
        docData.push(data)
        ids.push(doc.id as D)
      })

      return docData
    } catch (e) {
      logError(e, "Error getting document by filter:", {
        whereConditions,
        limit,
        orderBy,
        afterSnapshot,
      })
      throw new RepositoryError(this.#repositoryId, `Error getting documents by filter: ${e}`)
    }
  }

  async getMany(ids?: D[]) {
    const querySnapshots: FirebaseQueryType[] = []
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
      logError(e, "Error getting document by IDs:", { ids })
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

    return allData
  }

  async create(data: Partial<T>, isOffline = false) {
    if (!data) {
      throw new RepositoryError(this.#repositoryId, "No data provided for create() method")
    }

    // If document id is included in data, use set() instead of add()
    let docId
    if (this.#documentIdField in data) {
      docId = data[this.#documentIdField]
    }

    const convertedData = this._processDataForFirestore(data)
    // Stamp _createdAt and _modifiedAt to all data created
    convertedData._createdAt = firestore.FieldValue.serverTimestamp()
    convertedData._modifiedAt = firestore.FieldValue.serverTimestamp()

    // Get a new document reference if no document ID is provided
    let newDocRef: FirebaseFirestoreTypes.DocumentReference
    if (docId) {
      newDocRef = this.#firestoreCollection.doc(docId)
    } else {
      newDocRef = this.#firestoreCollection.doc()
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
      logError(e, "Error creating document with data:", { data, convertedData })
      throw new RepositoryError(this.#repositoryId, `Error creating document: ${e}`)
    }
  }

  async update(
    id: D,
    data: { [P in keyof T]?: T[P] | FirebaseFirestoreTypes.FieldValue | null },
    useSetMerge = false,
    isOffline = false,
  ) {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for update() method")
    }

    const convertedData = this._processDataForFirestore(data)
    // Update _modifiedAt timestamp to all data updated
    convertedData._modifiedAt = firestore.FieldValue.serverTimestamp()
    try {
      const docRef = this.#firestoreCollection.doc(id as string)

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

      return snapshotData
    } catch (e) {
      logError(e, "Error updating document with data:", { id, useSetMerge, data, convertedData })
      throw new RepositoryError(this.#repositoryId, `Error updating document: ${e}`)
    }
  }

  async upsert(
    id: D,
    data: { [P in keyof T]?: T[P] | FirebaseFirestoreTypes.FieldValue | null },
    isOffline = false,
  ) {
    // upsert() is just an alias for update() with useSetMerge = true
    return await this.update(id, data, true, isOffline)
  }

  async delete(id: D) {
    if (!id) {
      throw new RepositoryError(this.#repositoryId, "No document ID provided for delete() method")
    }

    try {
      await this.#firestoreCollection.doc(id as string).delete()
    } catch (e) {
      logError(e, "Error deleting document:", { id })
      throw new RepositoryError(this.#repositoryId, `Error deleting document: ${e}`)
    }
  }

  subscribeToCollection(
    callback: (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => void,
  ): () => void {
    return this.#firestoreCollection.onSnapshot(callback)
  }

  subscribeToDocument(
    documentId: D,
    callback: (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => void,
  ): () => void {
    return this.#firestoreCollection.doc(documentId).onSnapshot(callback)
  }
}
