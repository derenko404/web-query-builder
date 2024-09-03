import { describe, it, expect } from 'vitest'
import { Schema } from '../core'

describe('Schema', () => {
  it('should create tables', () => {
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

    expect(schema.validator).toHaveProperty('users')
    expect(schema.validator).toHaveProperty('emails')
  })

  it('should validate schema', () => {
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

    expect(schema.validate('users', { id: 1, name: 'test' }).isValid).toBe(true)
    expect(schema.validate('users', { id: 'test', name: 'test' }).isValid).toBe(
      false
    )

    expect(
      schema.validate('emails', { userId: 1, content: 'test' }).isValid
    ).toBe(true)
    expect(
      schema.validate('emails', { userId: '1', content: 'test' }).isValid
    ).toBe(false)
  })
})
