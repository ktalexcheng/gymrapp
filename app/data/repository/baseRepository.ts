
export interface IBaseRepository<T> {
  get(id: any): Promise<T>
  getMany?(filter?: any): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: any, data: Partial<T>): Promise<void>
  delete(id: any): Promise<void>
}
