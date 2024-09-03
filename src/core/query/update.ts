import { QueryOptions } from '../query-options'
import { QueryOperator, StorageAdapter } from '../types'
import { QueryResult } from '../utils'

export class UpdateQuery<const Table> {
  private qo: QueryOptions
  private result: QueryResult

  constructor(
    private adapter: StorageAdapter,
    private key: string,
    private value: Partial<Table>
  ) {
    this.adapter = adapter
    this.key = key
    this.value = value

    this.qo = new QueryOptions({
      type: 'update',
      table: this.key,
      fields: Object.keys(this.value),
    })

    this.result = new QueryResult()
  }

  where<F extends keyof Table>(
    field: F,
    operator: QueryOperator,
    value: Table[F]
  ) {
    this.qo.set('where', {
      // @ts-ignore
      field,
      operator,
      value,
    })

    return this
  }

  async run() {
    try {
      const result = await this.adapter.update(
        this.key,
        this.value,
        this.qo.options
      )

      this.result.count = result.count

      return this.result
    } catch (e) {
      this.result.error = e as Error

      return this.result
    }
  }
}
