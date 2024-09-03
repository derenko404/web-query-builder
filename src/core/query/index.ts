import { StorageAdapter } from '../types'
import { DeleteQuery } from './delete'
import { InsertQuery } from './insert'
import { SelectQuery } from './select'
import { UpdateQuery } from './update'

export class Query<const Schema> {
  constructor(
    private key: string,
    private adapter: StorageAdapter
  ) {
    this.key = key
    this.adapter = adapter
  }

  select<F extends keyof Schema>(
    fields: F | F[] | '*'
  ): SelectQuery<Schema, F> {
    return new SelectQuery<Schema, F>(this.adapter, this.key, fields)
  }

  insert<R extends Schema>(record: R) {
    return new InsertQuery<Schema>(this.adapter, this.key, record)
  }

  delete() {
    return new DeleteQuery<Schema>(this.adapter, this.key)
  }

  update<R extends Schema>(record: Partial<R>) {
    return new UpdateQuery<Schema>(this.adapter, this.key, record)
  }
}
