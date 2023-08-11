import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"

export class RepositoryError extends Error {
  constructor(message) {
    super(message)
    this.name = "RepositoryError"
  }
}

export interface BaseRepository<T> {
  _collectionName: string
  _firestoreClient: FirebaseFirestoreTypes.Module

  get(id: string): Promise<T>
  getMany?(filter: any): Promise<T[]>
  create(data: Partial<T>): Promise<any>
  update?(data: Partial<T>): Promise<any>
  updateById(id: string, data: Partial<T>): Promise<any>
  delete(id: string): Promise<any>
}
