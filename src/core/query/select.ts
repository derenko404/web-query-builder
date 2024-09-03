import { GetKeys, QueryOperator, StorageAdapter } from '../types'
import { QueryOptions } from '../query-options'

import { Prettify } from '../types'
import { SelectQueryResult } from '../utils'

export class SelectQuery<const Table, const Fields extends keyof Table> {
  private result: SelectQueryResult<Table>
  private qo: QueryOptions

  constructor(
    private adapter: StorageAdapter,
    private key: string,
    private fields: Fields | Fields[] | '*'
  ) {
    this.adapter = adapter
    this.key = key
    this.fields = fields

    this.qo = new QueryOptions({
      type: 'select',
      table: this.key,
      fields: this.fields as string | string[] | '*',
    })

    this.result = new SelectQueryResult()
  }

  where<F extends Fields>(field: F, operator: QueryOperator, value: Table[F]) {
    this.qo.set('where', {
      // @ts-ignore
      field,
      operator,
      value,
    })

    return this
  }

  limit(limit: number) {
    this.qo.set('limit', limit)

    return this
  }

  orderBy<T extends Fields>(field: T, order: 'ASC' | 'DESC') {
    this.qo.set('orderBy', {
      // @ts-ignore
      field,
      order,
    })

    return this
  }

  async run() {
    try {
      const result = await this.adapter.get(this.key, this.qo.options)

      this.result.data = result.rows
      this.result.count = result.rows.length

      return this.result as SelectQueryResult<Prettify<GetKeys<Table, Fields>>>
    } catch (e: any) {
      this.result.data = []
      this.result.error = e as Error

      return this.result
    }
  }
}
