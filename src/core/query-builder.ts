import { Query } from './query'
import { Schema, InferSchemaType } from './schema'
import { StorageAdapter, TableKeys } from './types'

export class QueryBuilder<
  const Adapter extends StorageAdapter,
  R extends Schema<Record<string, any>>,
> {
  constructor(
    private adapter: Adapter,

    // @ts-ignore
    private schema: R
  ) {
    this.adapter = adapter
    this.schema = schema
  }

  from<Key extends TableKeys<R['validator']>>(tableName: Key) {
    const key = `${tableName as string}` as string

    if (!this.adapter) {
      throw new Error('adapter is not initialized')
    }

    return new Query<InferSchemaType<R['validator']>[Key]>(key, this.adapter)
  }
}
