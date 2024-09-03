import { describe, test, expectTypeOf, beforeEach, vi, afterEach } from 'vitest'
import { LocalStorageAdapter, QueryBuilder, Schema } from '../core'

const schema = new Schema().createTables((v) => ({
  users: v.object({
    id: v.number(),
    name: v.string(),
  }),
  emails: v.object({
    userId: v.number(),
    content: v.string(),
  }),
}))

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

describe('test qb user facing types', () => {
  let ls
  let qb: QueryBuilder<LocalStorageAdapter, typeof schema>

  beforeEach(() => {
    // Stub the global localStorage before each test
    ls = new LocalStorageAdapter()
    qb = new QueryBuilder(ls, schema)

    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    // Reset all mocks after each test to avoid cross-test interference
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  test('qb.from', () => {
    expectTypeOf(qb.from).parameter(0).toMatchTypeOf<'users' | 'emails'>()
  })

  describe('select', () => {
    test('select', () => {
      expectTypeOf(qb.from('users').select)
        .parameter(0)
        .toMatchTypeOf<'*' | 'id' | 'name' | ('id' | 'name')[]>()
    })

    test('select.where', () => {
      const f = qb.from('users').select('*').where

      expectTypeOf(f).parameter(0).toMatchTypeOf<'id' | 'name'>()
      expectTypeOf(f).parameter(2).toMatchTypeOf<number | string>()
    })

    test('select.where', () => {
      const f = qb.from('users').select('id').where

      expectTypeOf(f).parameter(0).toMatchTypeOf<'id'>()
      expectTypeOf(f).parameter(2).toMatchTypeOf<number | string>()
    })

    test('select.orderBy', () => {
      const f = qb.from('users').select('*').where('id', '=', 1).orderBy

      expectTypeOf(f).parameter(0).toMatchTypeOf<'id' | 'name'>()
      expectTypeOf(f).parameter(1).toMatchTypeOf<'ASC' | 'DESC'>()
    })

    test('select.limit', () => {
      const f = qb.from('users').select('*').where('id', '=', 1).limit

      expectTypeOf(f).parameter(0).toMatchTypeOf<number>()
    })
  })

  describe('where', () => {})

  describe(() => {})

  describe('types for insert query', () => {
    test('insert', () => {
      const f = qb.from('users').insert

      expectTypeOf(f).parameter(0).toMatchTypeOf<{ name: string; id: number }>()
    })
  })

  describe('types for update query', () => {
    test('update', () => {
      const f = qb.from('users').update

      expectTypeOf(f)
        .parameter(0)
        .toMatchTypeOf<{ name?: string; id?: number }>()
    })

    test('update.where', () => {
      const f = qb.from('users').update({ id: 1, name: 'test' }).where

      expectTypeOf(f).parameter(0).toMatchTypeOf<'id' | 'name'>()
      expectTypeOf(f).parameter(2).toMatchTypeOf<string | number>()
    })
  })

  describe('types for delete query', () => {
    test('delete', () => {
      const f = qb.from('users').delete

      expectTypeOf(f).parameter(0).toMatchTypeOf<undefined>()
    })

    test('delete.where', () => {
      const f = qb.from('users').delete().where

      expectTypeOf(f).parameter(0).toMatchTypeOf<'id' | 'name'>()
      expectTypeOf(f).parameter(2).toMatchTypeOf<string | number>()
    })
  })
})
