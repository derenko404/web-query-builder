import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { LocalStorageAdapter, QueryBuilder, Schema } from '../core'
import {
  createRandomRow,
  createRandomRows,
  createRandomRowsWithPredefinedFields,
} from './utils/seed'
import { MockLocalStorage } from './mocks'

const schema = new Schema().createTables((v) => ({
  users: v.object({
    sex: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    avatar: v.string(),
    age: v.number(),
  }),
}))

describe('QueryBuilder', async () => {
  let adapter: LocalStorageAdapter
  let qb: QueryBuilder<LocalStorageAdapter, typeof schema>

  beforeEach(async () => {
    vi.stubGlobal('localStorage', new MockLocalStorage())
    adapter = await new LocalStorageAdapter().connect()

    qb = new QueryBuilder(adapter, schema)
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  describe('insert', () => {
    it('should save record', async () => {
      const { row } = await createRandomRow(qb)

      const result = await qb.from('users').insert(row).run()

      expect(result.count).toBe(1)
    })

    it('should not save invalid record when schema is passed', async () => {
      adapter = await new LocalStorageAdapter(schema).connect()
      qb = new QueryBuilder(adapter, schema)

      const { row } = await createRandomRow(qb)

      const { age: _, ...rest } = row

      // @ts-expect-error
      const result = await qb.from('users').insert(rest).run()

      expect(result.count).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('select', () => {
    it('should select without errors', async () => {
      const result = await qb.from('users').select('*').run()

      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toStrictEqual([])
      expect(result.error).toBe(null)
    })

    it('should select all saved records', async () => {
      const { count } = await createRandomRows(qb)
      const result = await qb.from('users').select('*').run()

      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(count)
      expect(result.error).toBe(null)
    })

    it('should select records with all fields when * is passed as field', async () => {
      await createRandomRows(qb)
      const result = await qb.from('users').select('*').run()
      const fields = Object.keys(schema.validator.users.entries)

      result.data.forEach((record) => {
        fields.forEach((field) => {
          expect(record).toHaveProperty(field)
        })
      })
    })

    it('should select records only with fields which are passed as string', async () => {
      await createRandomRows(qb)
      const fields = Object.keys(schema.validator.users.entries)
      const fieldToSelect = fields[0]

      // @ts-expect-error
      const result = await qb.from('users').select(fieldToSelect).run()

      result.data.forEach((record) => {
        fields.forEach((field) => {
          if (field === fieldToSelect) {
            expect(record).toHaveProperty(field)
          } else {
            expect(record).not.toHaveProperty(field)
          }
        })
      })
    })

    it('should select records only with fields which are passed as array', async () => {
      await createRandomRows(qb)
      const fields = Object.keys(schema.validator.users.entries)
      const fieldToSelect = fields[0]

      // @ts-ignore
      const result = await qb.from('users').select([fieldToSelect]).run()

      result.data.forEach((record) => {
        fields.forEach((field) => {
          if (field === fieldToSelect) {
            expect(record).toHaveProperty(field)
          } else {
            expect(record).not.toHaveProperty(field)
          }
        })
      })
    })

    it('should select proper records', async () => {
      const { rows } = await createRandomRows(qb)
      const result = await qb
        .from('users')
        .select('*')
        .where('age', '>', 10)
        .run()
      const expected = rows.filter((r) => r.age > 10).length

      expect(result.data.length).toBe(expected)
    })

    it('should limit number of selected records', async () => {
      await createRandomRows(qb)
      const expected = 2
      const result = await qb.from('users').select('*').limit(expected).run()

      expect(result.data.length).toBe(expected)
    })

    it('should find all records which match wildcard', async () => {
      await createRandomRowsWithPredefinedFields(qb, 10, [
        {
          email: 'my-very@randomemail.com',
        },
        {
          email: 'giga-chad@giga-chad.com',
        },
        {
          email: 'random@fake.com',
        },
      ])

      const result1 = await qb
        .from('users')
        .select('*')
        .where('email', '=', 'my-very*memail.com')
        .run()
      const result2 = await qb
        .from('users')
        .select('*')
        .where('email', '=', '*giga-chad*.com')
        .run()
      const result3 = await qb
        .from('users')
        .select('*')
        .where('email', '=', '*@fake.com')
        .run()
      const result4 = await qb
        .from('users')
        .select('*')
        .where('email', '=', 'fasfa')
        .run()
      const result5 = await qb
        .from('users')
        .select('*')
        .where('email', '=', '*')
        .run()

      expect(result1.count).toBe(1)
      expect(result2.count).toBe(1)
      expect(result3.count).toBe(1)
      expect(result4.count).toBe(0)
      expect(result5.count).toBe(10)
    })

    it('should order in ASC direction', async () => {
      const { rows } = await createRandomRows(qb)
      const result = await qb
        .from('users')
        .select('age')
        .orderBy('age', 'DESC')
        .run()

      expect(result.data).toStrictEqual(
        [...rows].sort((a, b) => b.age - a.age).map((r) => ({ age: r.age }))
      )
    })

    it('should order in DESC direction', async () => {
      const { rows } = await createRandomRows(qb)
      const result = await qb
        .from('users')
        .select('age')
        .orderBy('age', 'ASC')
        .run()

      expect(result.data).toStrictEqual(
        [...rows].sort((a, b) => a.age - b.age).map((r) => ({ age: r.age }))
      )
    })
  })

  describe('update', () => {
    it('should update', async () => {
      const { row } = await createRandomRow(qb)
      const r = await qb
        .from('users')
        .update({ email: 'test-email@gmail.com' })
        .run()

      const result = await qb.from('users').select('*').run()

      expect(result.data).toStrictEqual([
        { ...row, email: 'test-email@gmail.com' },
      ])
      expect(r.count).toBe(1)
    })

    it('should not update records which does not match where', async () => {
      const { row } = await createRandomRow(qb)
      await qb
        .from('users')
        .update({ email: 'test-email@gmail.com' })
        .where('avatar', '=', 'not-existing-avatar')
        .run()

      const result = await qb.from('users').select('*').run()

      expect(result.data).toStrictEqual([row])
    })
  })

  describe('delete', () => {
    it('should delete', async () => {
      const { rows } = await createRandomRows(qb)

      await qb
        .from('users')
        .delete()
        .where('firstName', '=', rows[0].firstName)
        .where('lastName', '=', rows[0].lastName)
        .where('email', '=', rows[0].email)
        .run()

      const { data } = await qb.from('users').select('*').run()

      expect(data.length).toBe(9)
    })

    it('should not delete rows which doesnt match records', async () => {
      const { rows } = await createRandomRows(qb)

      await qb.from('users').delete().where('firstName', '=', 'fake-name').run()

      const { data } = await qb.from('users').select('*').run()

      expect(data.length).toBe(rows.length)
    })
  })
})
