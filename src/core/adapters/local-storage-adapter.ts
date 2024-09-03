import { Options } from '../query-options'
import { Schema } from '../schema'
import {
  StorageAdapter,
  GetStorageResult,
  SetStorageResult,
  UpdateStorageResult,
  DeleteStorageResult,
} from '../types'
import { FilterFunction, pickFields } from '../utils'
import { SharedAdaptersMethods } from './shared-methods'

export class LocalStorageAdapter
  extends SharedAdaptersMethods
  implements StorageAdapter
{
  constructor(
    private schema?: Schema<Record<string, any>>,
    private options?: {
      useId: boolean
    }
  ) {
    super()
    this.schema = schema
    this.options = options
  }

  async connect(): Promise<this> {
    if (this.schema) {
      const keys = Object.keys(this.schema.validator)

      for (const key of keys) {
        const value = localStorage.getItem(key)

        if (value) {
          const parsed = JSON.parse(value)

          if (!Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify([]))
          }
        } else {
          localStorage.setItem(key, JSON.stringify([]))
        }
      }
    }

    return this
  }

  async get(key: string, options: Options): Promise<GetStorageResult> {
    let rows = this.getSavedRows(key)

    if (rows.length) {
      if (options.where?.length) {
        const filters = this.createFilterFunctions(options.where)
        rows = rows.filter((row: any) => filters.every((f) => f(row)))
      }
    } else {
      localStorage.setItem(key, JSON.stringify([]))

      rows = []
    }

    if (options.orderBy) {
      this.orderBy(rows, options.orderBy.field, options.orderBy.order)
    }

    if (options.limit) {
      rows = rows.splice(0, options.limit)
    }

    rows =
      options.fields === '*'
        ? rows.map((row) => row)
        : rows.map((row) => pickFields(row, options.fields as string[]))

    return {
      rows,
    }
  }

  async set(
    key: string,
    value: Record<string, any>
  ): Promise<SetStorageResult> {
    const rows = this.getSavedRows(key)

    if (this.schema) {
      const { isValid, issues } = this.schema.validate(key, value)

      if (!isValid) {
        if (issues?.length) {
          const [error] = issues
          const fieldName = error.path[0]?.key || ''
          throw new Error(`${key}.${fieldName} ${error.message.toLowerCase()}`)
        } else {
          throw new Error(
            `invalid input value for ${key} ${JSON.stringify(value)}`
          )
        }
      }
    }

    if (rows.length) {
      if (this.options?.useId) {
        const id = value.id

        if (rows.find((value: any) => value.id === id)) {
          throw new Error(
            `error when trying to set record with the same id key ${id}`
          )
        }
      }

      localStorage.setItem(key, JSON.stringify([...rows, value]))
    } else {
      localStorage.setItem(key, JSON.stringify([value]))
    }

    return {
      count: 1,
    }
  }

  async update(
    key: string,
    value: any,
    options: Options
  ): Promise<UpdateStorageResult> {
    const rows = this.getSavedRows(key)

    if (options.where?.length) {
      const filters = this.createFilterFunctions(options.where)

      const { updatedRows, count } = this.updateAllWithFilterFunction(
        rows,
        value,
        filters
      )

      localStorage.setItem(key, JSON.stringify(updatedRows))

      return {
        count,
      }
    } else {
      const updatedRows = this.updateAll(rows, value)

      localStorage.setItem(key, JSON.stringify(updatedRows))

      return {
        count: updatedRows.length,
      }
    }
  }

  async delete(key: string, options: Options): Promise<DeleteStorageResult> {
    const rows = this.getSavedRows(key)

    if (options.where?.length) {
      const filters = this.createFilterFunctions(options.where)

      const { updatedRows, count } = this.deleteAllWithFilterFunctions(
        rows,
        filters
      )
      localStorage.setItem(key, JSON.stringify(updatedRows))

      return {
        count,
      }
    } else {
      localStorage.removeItem(key)
      localStorage.setItem(key, '[]')

      return {
        count: rows.length,
      }
    }
  }

  private updateAll(rows: any[], value: any) {
    return rows.map((row) => ({ ...row, ...value }))
  }

  private updateAllWithFilterFunction(
    rows: any[],
    value: any,
    filterFunctions: FilterFunction[]
  ) {
    let count = 0

    const updatedRows = rows.map((row) => {
      if (filterFunctions.every((f) => f(row))) {
        count++

        return {
          ...row,
          ...value,
        }
      } else {
        return row
      }
    })

    return {
      updatedRows,
      count,
    }
  }

  private deleteAllWithFilterFunctions(
    rows: any[],
    filterFunctions: FilterFunction[]
  ) {
    let count = 0
    const updatedRows = rows.filter((row: any) => {
      if (filterFunctions.every((f) => f(row))) {
        count++
        return false
      } else {
        return true
      }
    })

    return {
      updatedRows,
      count,
    }
  }

  private getSavedRows(key: string): any[] {
    const rowsJson = localStorage.getItem(key)

    if (rowsJson && Array.isArray(JSON.parse(rowsJson))) {
      return JSON.parse(rowsJson)
    } else {
      localStorage.setItem(key, '[]')
      return []
    }
  }
}
