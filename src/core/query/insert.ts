import { StorageAdapter } from '../types'
import { QueryResult } from '../utils'

export class InsertQuery<Table> {
  private result: QueryResult

  constructor(
    private adapter: StorageAdapter,
    private key: string,
    private value: Table
  ) {
    this.adapter = adapter
    this.key = key
    this.value = value

    this.result = new QueryResult()
  }

  async run() {
    try {
      const result = await this.adapter.set(this.key, this.value)
      this.result.count = result.count

      return this.result
    } catch (e) {
      this.result.error = e as Error
      return this.result
    }
  }
}
