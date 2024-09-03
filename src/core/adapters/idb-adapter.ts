import { StorageAdapter, GetStorageResult, SetStorageResult } from '../types'
import { Schema } from '../schema'
import { Options } from '../query-options'
import { FilterFunction, pickFields, removeFields } from '../utils'
import { SharedAdaptersMethods } from './shared-methods'

const IDB_ID_KEY = '__id'

export class IndexedDbAdapter
  extends SharedAdaptersMethods
  implements StorageAdapter
{
  db: IDBDatabase | null

  constructor(
    public schema: Schema<Record<string, any>>,
    private dbName: string = 'database',
    private version: number = 1
  ) {
    super()
    this.dbName = dbName
    this.version = version

    this.schema = this.createConfigurationFromSchema(schema)

    this.db = null
  }

  async connect() {
    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version)

        request.onsuccess = (event) => {
          // @ts-ignore
          resolve(event.target.result)
        }

        request.onerror = (event) => {
          reject(
            // @ts-ignore
            new Error(`error opening database: ${event.target.errorCode}`)
          )
        }

        request.onupgradeneeded = (event) => {
          // @ts-ignore
          const db = event.target.result as IDBDatabase

          Object.entries(this.schema).forEach(
            ([storeName, { indexes, unique }]) => {
              // Create object store with the specified key path
              const objectStore = db.createObjectStore(storeName, {
                keyPath: IDB_ID_KEY,
                autoIncrement: true,
              })
              // Create index with the specified index field
              indexes.forEach((index: string) => {
                objectStore.createIndex(`by_${index}`, index, {
                  unique: unique?.includes(index),
                })
              })
            }
          )
        }
      })

      return this
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async get(key: string, options: Options): Promise<GetStorageResult> {
    let rows: any[] = []

    if (options.where?.length) {
      const filters = this.createFilterFunctions(options.where)
      rows = await this.getAllWithFilterFunctions(key, filters)
    } else {
      rows = await this.getAll(key)
    }

    if (options.orderBy) {
      this.orderBy(rows, options.orderBy.field, options.orderBy.order)
    }

    if (options.limit) {
      rows = this.limit(rows, options.limit)
    }

    rows =
      options.fields === '*'
        ? rows.map((row) => removeFields(row, [IDB_ID_KEY]))
        : rows.map((row) =>
            removeFields(pickFields(row, options.fields as string[]), [
              IDB_ID_KEY,
            ])
          )

    return {
      rows,
    }
  }

  async set(key: string, value: any) {
    return await this.saveOne(key, value)
  }

  async update(key: string, value: any, options: Options) {
    let count = 0

    if (options.where?.length) {
      const filters = this.createFilterFunctions(options.where)

      for await (const field of options.fields) {
        count += await this.updateByFieldWithFilterFunctions(
          key,
          field,
          value,
          filters
        )
      }
    } else {
      for await (const field of options.fields) {
        count += await this.updateByField(key, field, value)
      }
    }

    return {
      count,
    }
  }

  async delete(key: string, options: Options) {
    let count = 0

    if (options.where?.length) {
      const filters = this.createFilterFunctions(options.where)

      // @eslint-ignore
      for await (const _ of options.where) {
        count += await this.deleteByFieldWithFilterFunctions(key, filters)
      }
    } else {
      count += await this.deleteAll(key)
    }

    return {
      count,
    }
  }

  private createConfigurationFromSchema = <
    T extends Schema<Record<string, any>>,
  >(
    schema: T
  ) => {
    const s = schema.validator

    const tables = Object.keys(s)

    const configuration = {} as typeof s

    for (const table of tables) {
      configuration[table] = {
        indexes: [],
        unique: configuration[table]?.unique ?? [],
      }

      const entries = s[table].entries

      for (const entry of Object.keys(entries)) {
        configuration[table]['indexes'].push(entry)
      }
    }

    return configuration as any
  }

  private async getAllWithFilterFunctions(
    key: string,
    filterFunctions: FilterFunction[]
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          throw new Error('database connection is not available')
        }

        const transaction = this.db.transaction([key], 'readonly')
        const objectStore = transaction.objectStore(key)
        const rows: any[] = []

        const request = objectStore.openCursor()

        request.onsuccess = (event) => {
          //@ts-ignore
          const cursor = event.target.result

          if (cursor) {
            if (filterFunctions.every((f) => f(rows))) {
              rows.push(cursor.value) // Apply custom filtering logic
            }
            cursor.continue()
          } else {
            resolve(rows)
          }
        }

        request.onerror = (event) => {
          reject(
            new Error(
              //@ts-ignore
              `failed to retrieve records: ${event.target.error?.message || 'Unknown error'}`
            )
          )
        }

        transaction.onabort = function () {
          reject(new Error('transaction aborted'))
        }

        transaction.onerror = function () {
          reject(new Error('transaction error'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private async getAll(key: string): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        throw new Error('database connection is not available')
      }

      const transaction = this.db.transaction([key], 'readonly')
      const objectStore = transaction.objectStore(key)
      const request = objectStore.getAll()

      request.onsuccess = function () {
        resolve(request.result)
      }
    })
  }

  private updateByField(
    key: string,
    field: string,
    value: any
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        throw new Error('database connection is not available')
      }

      let count = 0
      const transaction = this.db.transaction(key, 'readwrite')
      const objectStore = transaction.objectStore(key)
      const index = objectStore.index(`by_${field}`)
      const cursorRequest = index.openCursor()

      cursorRequest.onsuccess = async function (event) {
        // @ts-ignore
        const cursor = event.target.result

        if (cursor) {
          const row = cursor.value

          row[field] = value[field]

          try {
            await new Promise((resolve, reject) => {
              const updateRequest = cursor.update(row)
              updateRequest.onsuccess = () => {
                count++
                resolve(true)
              }
              updateRequest.onerror = () => reject(updateRequest.error)
            })

            cursor.continue()
          } catch (error) {
            reject(error)
          }
        } else {
          resolve(count)
        }
      }

      cursorRequest.onerror = () => reject(cursorRequest.error)
    })
  }

  private updateByFieldWithFilterFunctions(
    key: string,
    field: string,
    value: any,
    filterFunctions: FilterFunction[]
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        throw new Error('database connection is not available')
      }

      let count = 0
      const transaction = this.db.transaction(key, 'readwrite')
      const objectStore = transaction.objectStore(key)
      const index = objectStore.index(`by_${field}`)
      const cursorRequest = index.openCursor()

      cursorRequest.onsuccess = async function (event) {
        // @ts-ignore
        const cursor = event.target.result

        if (cursor) {
          const row = cursor.value

          if (filterFunctions.every((f) => f(row))) {
            row[field] = value[field]

            try {
              await new Promise((resolve, reject) => {
                const updateRequest = cursor.update(row)
                updateRequest.onsuccess = () => {
                  count++
                  resolve(true)
                }
                updateRequest.onerror = () => reject(updateRequest.error)
              })

              cursor.continue()
            } catch (error) {
              reject(error)
            }
          } else {
            cursor.continue()
          }
        } else {
          resolve(count)
        }
      }

      cursorRequest.onerror = () => reject(cursorRequest.error)
    })
  }

  private deleteAll(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        throw new Error('database connection is not available')
      }

      let count = 0
      const transaction = this.db.transaction(key, 'readwrite')
      const objectStore = transaction.objectStore(key)

      // Open a cursor to iterate over records
      const cursorRequest = objectStore.openCursor()

      cursorRequest.onsuccess = async (event) => {
        // @ts-ignore
        const cursor = event.target.result

        if (cursor) {
          await new Promise((resolve, reject) => {
            const deleteRequest = cursor.delete()

            deleteRequest.onsuccess = () => {
              count++
              resolve(true)
            }
            deleteRequest.onerror = () => reject(deleteRequest.error)
          })

          // Continue to the next record
          cursor.continue()
        } else {
          resolve(count)
        }
      }

      cursorRequest.onerror = () => {
        reject(cursorRequest.error)
      }
    })
  }

  private deleteByFieldWithFilterFunctions(
    key: string,
    filterFunctions: FilterFunction[]
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        throw new Error('database connection is not available')
      }

      let count = 0
      const transaction = this.db.transaction(key, 'readwrite')
      const objectStore = transaction.objectStore(key)

      // Open a cursor to iterate over records
      const cursorRequest = objectStore.openCursor()

      cursorRequest.onsuccess = async (event) => {
        // @ts-ignore
        const cursor = event.target.result

        if (cursor) {
          const row = cursor.value

          if (filterFunctions.every((f) => f(row))) {
            await new Promise((resolve, reject) => {
              const deleteRequest = cursor.delete()

              deleteRequest.onsuccess = () => {
                count++
                resolve(true)
              }
              deleteRequest.onerror = () => reject(deleteRequest.error)
            })
          }

          // Continue to the next record
          cursor.continue()
        } else {
          resolve(count)
        }
      }

      cursorRequest.onerror = () => {
        reject(cursorRequest.error)
      }
    })
  }

  private saveOne(key: string, value: any): Promise<SetStorageResult> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          throw new Error('database connection is not available')
        }

        const transaction = this.db.transaction([key], 'readwrite')

        const objectStore = transaction.objectStore(key)
        const request = objectStore.add(value)

        request.onsuccess = function () {
          resolve({
            count: 1,
          })
        }

        request.onerror = function (event) {
          reject(
            new Error(
              // @ts-ignore
              `failed to add record: ${event.target.error?.message || 'unknown error'}`
            )
          )
        }

        transaction.onabort = function () {
          reject(new Error('transaction aborted'))
        }

        transaction.onerror = function () {
          reject(new Error('transaction error'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }
}
