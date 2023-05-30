export class RepositoryError extends Error {
  constructor(message) {
    super(message)
    this.name = "RepositoryError"
  }
}

export interface IBaseRepository<T> {
  get(id: string): Promise<T>
  getMany?(filter: any): Promise<T[]>
  create(data: Partial<T>): Promise<void>
  update(id: string, data: Partial<T>): Promise<void>
  delete(id: string): Promise<void>
}
