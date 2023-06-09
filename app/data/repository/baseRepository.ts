export class RepositoryError extends Error {
  constructor(message) {
    super(message)
    this.name = "RepositoryError"
  }
}

export interface BaseRepository<T> {
  get(id: string): Promise<T>
  getMany?(filter: any): Promise<T[]>
  create(data: Partial<T>): Promise<any>
  update(id: string, data: Partial<T>): Promise<any>
  delete(id: string): Promise<any>
}
