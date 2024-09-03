import { Options } from './query-options'

export type Table<T extends Record<string, any>> = T & {}

export type TableKeys<T extends Record<string, any>> = keyof T

export type GetKeys<T, K extends keyof T> = { [P in K]: T[P] } & {}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type GetStorageResult = {
  rows: any[]
}

export type SetStorageResult = {
  count: number
}

export type UpdateStorageResult = SetStorageResult

export type DeleteStorageResult = SetStorageResult

export interface StorageAdapter {
  connect(): Promise<this>
  get(key: string, qo: Options): Promise<GetStorageResult>
  set(key: string, value: any): Promise<SetStorageResult>
  update(key: string, value: any, qo: Options): Promise<UpdateStorageResult>
  delete(key: string, qo: Options): Promise<DeleteStorageResult>
}

export type QueryOperator = '>' | '<' | '=' | '>=' | '<='
