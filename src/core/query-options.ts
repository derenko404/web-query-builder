import type { QueryOperator } from './types'

export type Options = {
  type: 'select' | 'insert' | 'update' | 'delete'
  table: string
  fields: string[] | '*'
  where?: {
    field: string
    operator: QueryOperator
    value: any
  }[]
  orderBy?: {
    field: string
    order: 'ASC' | 'DESC'
  }
  limit?: number
}

export class QueryOptions {
  public options: Options

  constructor({
    type,
    table,
    fields,
  }: {
    type: Options['type']
    table: Options['table']
    fields: string | string[] | '*'
  }) {
    this.options = {
      type,
      table,
      fields: this.transformFields(fields),
      where: [],
    }
  }

  set<K extends keyof Options>(key: K, value: Options[K]) {
    if (Array.isArray(this.options[key])) {
      // @ts-ignore
      this.options[key].push(value)
    } else {
      this.options[key] = value
    }
  }

  private transformFields(fields?: string | string[] | '*'): '*' | string[] {
    if (!fields) {
      return '*'
    }

    if (fields === '*') {
      return fields
    }

    if (Array.isArray(fields)) {
      return fields
    }

    return [fields]
  }
}
