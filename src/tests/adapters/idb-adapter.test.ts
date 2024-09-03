//@ts-ignore
import { IDBFactory } from 'fake-indexeddb'
import 'fake-indexeddb/auto'

import { describe, beforeEach, it, afterEach, expect, vi } from 'vitest'

import { IndexedDbAdapter, Schema } from '../../core'
import { isTablesAndFieldsExists } from '../mocks'

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

describe('IndexedDbAdapter', () => {
  let idb: IndexedDbAdapter
  const getDefaultOptions = {
    table: 'users',
    type: 'select' as const,
    fields: '*' as const,
  }

  const DATABASE_NAME = 'test-database'

  beforeEach(async () => {
    vi.stubGlobal('indexedDB', new IDBFactory())

    idb = new IndexedDbAdapter(schema, DATABASE_NAME)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('connect', () => {
    it('should receive and set database', async () => {
      const result = await idb.connect()

      expect(result.db).toBeDefined()
      expect(result.db!.name).toBe(DATABASE_NAME)
      expect(result.db?.objectStoreNames).toEqual(['emails', 'users'])
    })

    it('should create all needed tables and fields in indexedDB', async () => {
      await idb.connect()

      await idb.set('users', { id: 1, name: 'test' })
      await idb.set('emails', { userId: 1, content: 'test' })

      const tables = Object.keys(schema.validator)

      for await (const table of tables) {
        const result = await isTablesAndFieldsExists(
          DATABASE_NAME,
          table,
          Object.keys(
            // @ts-ignore
            schema.validator[table].entries
          )
        )

        expect(result).toBe(true)
      }
    })
  })

  it('should create configuration from schema', () => {
    const configuration = idb.schema

    const expected = {
      users: {
        indexes: ['id', 'name'],
        unique: [],
      },
      emails: {
        indexes: ['userId', 'content'],
        unique: [],
      },
    }

    expect(configuration).toStrictEqual(expected)
  })

  describe('set', () => {
    it('should save record', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'test' })
    })

    it('should throw error when conflicting id is passed', async () => {
      const conflictingRecord = { id: 1, name: 'test', __id: 1 }

      await idb.connect()
      await idb.set('users', conflictingRecord)

      await expect(idb.set('users', conflictingRecord)).rejects.toThrow()
    })
  })

  describe('get', () => {
    it('should return empty array when no records saved', async () => {
      await idb.connect()

      const result = await idb.get('users', getDefaultOptions)

      expect(result.rows).toStrictEqual([])
    })

    it('should return array of records when there are records saved', async () => {
      await idb.connect()

      await idb.set('users', { id: 1, name: 'test' })
      await idb.set('users', { id: 2, name: 'test-2' })
      await idb.set('users', { id: 3, name: 'test-3' })

      const result = await idb.get('users', getDefaultOptions)

      expect(Array.isArray(result.rows)).toBe(true)
      expect(result.rows.length).toBe(3)
    })
  })

  describe('update', () => {
    it('should update all rows when where is not passed', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'before-update' })
      await idb.set('users', { id: 2, name: 'before-update' })
      await idb.set('users', { id: 3, name: 'before-update' })

      const expected = { name: 'after-update' }

      const changed = await idb.update('users', expected, {
        table: 'users',
        fields: ['name'],
        type: 'update',
      })

      const result = await idb.get('users', getDefaultOptions)

      expect(result.rows.every((r) => r.name === expected.name))
      expect(changed.count).toBe(3)
    })

    it('should update rows which match where statement when where is passed', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'before-update' })
      await idb.set('users', { id: 2, name: 'before-update' })
      await idb.set('users', { id: 3, name: 'before-update' })

      const changed = await idb.update(
        'users',
        { name: 'after-update' },
        {
          table: 'users',
          fields: ['name'],
          type: 'update',
          where: [
            {
              field: 'id',
              operator: '>',
              value: 1,
            },
          ],
        }
      )

      const result = await idb.get('users', getDefaultOptions)

      expect(changed.count).toBe(2)
      expect(
        result.rows
          .filter((r) => r.id > 1)
          .every((r) => r.name === 'after-update')
      ).toBe(true)
    })

    it('should update only given fields', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'before-update' })

      const expected = { name: 'after-update' }

      const changed = await idb.update('users', expected, {
        table: 'users',
        fields: ['name'],
        type: 'update',
      })

      const result = await idb.get('users', getDefaultOptions)

      expect(changed.count).toBe(1)
      expect(result.rows[0].id).toBe(1)
      expect(result.rows[0].name).toBe('after-update')
    })
  })

  describe('delete', () => {
    it('should delete all rows when where is not passed', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'before-update' })
      await idb.set('users', { id: 2, name: 'before-update' })
      await idb.set('users', { id: 3, name: 'before-update' })

      const changed = await idb.delete('users', {
        type: 'delete',
        table: 'users',
        fields: [],
        where: [],
      })

      const result = await idb.get('users', getDefaultOptions)

      expect(result.rows).toStrictEqual([])
      expect(changed.count).toBe(3)
    })

    it('should delete all rows which match where statement', async () => {
      await idb.connect()
      await idb.set('users', { id: 1, name: 'delete-1' })
      await idb.set('users', { id: 2, name: 'delete-2' })
      await idb.set('users', { id: 3, name: 'delete-3' })

      const changed = await idb.delete('users', {
        type: 'delete',
        table: 'users',
        fields: [],
        where: [
          {
            field: 'id',
            value: 2,
            operator: '>=',
          },
        ],
      })

      const result = await idb.get('users', getDefaultOptions)

      expect(result.rows[0].id).toBe(1)
      expect(result.rows[0].name).toBe('delete-1')
      expect(changed.count).toBe(2)
    })
  })
})
