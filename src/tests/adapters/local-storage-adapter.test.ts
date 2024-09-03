import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocalStorageAdapter, Schema } from '../../core'
import { MockLocalStorage } from '../mocks'

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

describe('LocalStorageAdapter', () => {
  let ls: LocalStorageAdapter

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockLocalStorage())

    ls = new LocalStorageAdapter()
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  describe('connect', () => {
    it('should connect and return istance of addapter', async () => {
      await expect(ls.connect()).resolves.toBeInstanceOf(LocalStorageAdapter)
    })

    it('should create tables when schema is passed', async () => {
      ls = new LocalStorageAdapter(schema)

      await ls.connect()

      expect(localStorage.getItem('users')).toBe('[]')
      expect(localStorage.getItem('emails')).toBe('[]')
    })
  })

  describe('get', () => {
    it('should return empty array when there are no saved rows', async () => {
      await ls.connect()

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.rows).toStrictEqual([])
    })

    it('should return all saved rows', async () => {
      await ls.connect()

      const expected = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test-2' },
        { id: 3, name: 'test-3' },
      ]

      await ls.set('users', expected[0])
      await ls.set('users', expected[1])
      await ls.set('users', expected[2])

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.rows.length).toBe(3)
      expect(result.rows).toStrictEqual(expected)
    })

    it('should return rows which match where statemenet when where is passed', async () => {
      await ls.connect()

      const expected = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test-2' },
        { id: 3, name: 'test-3' },
      ]

      await ls.set('users', expected[0])
      await ls.set('users', expected[1])
      await ls.set('users', expected[2])

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
        where: [{ field: 'id', operator: '>', value: 2 }],
      })

      expect(result.rows.length).toBe(1)
      expect(result.rows).toStrictEqual([expected[2]])
    })
  })

  describe('set', () => {
    it('should save record', async () => {
      await ls.connect()

      const expected = { id: 1, name: 'test' }

      const result = await ls.set('users', expected)

      const r = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.count).toStrictEqual(1)
      expect(r.rows.length).toBe(1)
    })

    it('should not save invalid record when schema is passed and throw error', async () => {
      ls = new LocalStorageAdapter(schema)

      await ls.connect()

      const expected = { id: 1 }

      expect(ls.set('users', expected)).rejects.toThrow()
    })

    it('should throw error when conflicting id is passed and useId is true', async () => {
      ls = new LocalStorageAdapter(schema, { useId: true })

      await ls.connect()

      const conflictingRecord = { id: 1, name: 'test' }

      await ls.set('users', conflictingRecord)
      expect(ls.set('users', conflictingRecord)).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('should update all rows', async () => {
      await ls.connect()

      const expected = { id: 1, name: 'updated' }
      await ls.set('users', { id: 1, name: 'test' })

      const update = await ls.update('users', expected, {
        type: 'update',
        table: 'users',
        fields: [],
      })

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.rows[0]).toStrictEqual(expected)
      expect(result.rows.length).toBe(1)

      expect(update.count).toBe(1)
    })

    it('should update all rows which match where', async () => {
      await ls.connect()

      const expected = { name: 'updated' }

      await ls.set('users', { id: 1, name: 'test' })
      await ls.set('users', { id: 2, name: 'test-2' })
      await ls.set('users', { id: 3, name: 'test-3' })

      await ls.update('users', expected, {
        type: 'update',
        table: 'users',
        fields: [],
        where: [{ field: 'id', value: 2, operator: '>' }],
      })

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      const updatedRow = result.rows.filter((r) => r.id > 2)[0].name
      expect(updatedRow).toBe(expected.name)
      expect(result.rows.length).toBe(3)
    })
  })

  describe('delete', () => {
    it('should delete all rows', async () => {
      await ls.connect()

      await ls.set('users', { id: 1, name: 'test' })

      await ls.delete('users', {
        type: 'delete',
        table: 'users',
        fields: [],
      })

      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.rows).toStrictEqual([])
      expect(result.rows.length).toBe(0)
    })

    it('should delete all rows which match where', async () => {
      await ls.connect()

      await ls.set('users', { id: 1, name: 'test' })
      await ls.set('users', { id: 2, name: 'test-2' })
      await ls.set('users', { id: 3, name: 'test-3' })

      const r = await ls.delete('users', {
        type: 'delete',
        table: 'users',
        fields: [],
        where: [{ field: 'id', value: 2, operator: '>' }],
      })
      const result = await ls.get('users', {
        type: 'select',
        table: 'users',
        fields: '*',
      })

      expect(result.rows.length).toBe(2)
      expect(r.count).toBe(1)
    })
  })
})
