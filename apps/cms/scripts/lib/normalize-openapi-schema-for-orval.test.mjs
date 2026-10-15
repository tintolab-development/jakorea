import { describe, expect, it } from 'vitest'
import { normalizeOpenApiSchemaNode } from './normalize-openapi-schema-for-orval.mjs'

describe('normalizeOpenApiSchemaNode', () => {
  it('nullable string type array → type + nullable', () => {
    const schema = { type: ['string', 'null'] }
    normalizeOpenApiSchemaNode(schema)
    expect(schema).toEqual({ type: 'string', nullable: true })
  })

  it('nullable integer preserves non-null primitive', () => {
    const schema = { type: ['integer', 'null'] }
    normalizeOpenApiSchemaNode(schema)
    expect(schema).toEqual({ type: 'integer', nullable: true })
  })

  it('nested properties and required are preserved', () => {
    const root = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: ['string', 'null'] },
        count: { type: ['integer', 'null'] },
      },
    }
    normalizeOpenApiSchemaNode(root)
    expect(root.required).toEqual(['name'])
    expect(root.properties.name).toEqual({ type: 'string', nullable: true })
    expect(root.properties.count).toEqual({ type: 'integer', nullable: true })
  })

  it('nullable object type array', () => {
    const schema = {
      type: ['object', 'null'],
      properties: { id: { type: 'integer' } },
    }
    normalizeOpenApiSchemaNode(schema)
    expect(schema.type).toBe('object')
    expect(schema.nullable).toBe(true)
    expect(schema.properties.id).toEqual({ type: 'integer' })
  })

  it('array items with nullable type', () => {
    const schema = {
      type: 'array',
      items: { type: ['string', 'null'] },
    }
    normalizeOpenApiSchemaNode(schema)
    expect(schema.items).toEqual({ type: 'string', nullable: true })
  })

  it('keeps enum values including null (does not strip enum)', () => {
    const schema = { type: ['string', 'null'], enum: ['A', 'B', null] }
    normalizeOpenApiSchemaNode(schema)
    expect(schema.type).toBe('string')
    expect(schema.nullable).toBe(true)
    expect(schema.enum).toEqual(['A', 'B', null])
  })

  it('$ref with type null → nullable ref', () => {
    const schema = { $ref: '#/components/schemas/Foo', type: 'null' }
    normalizeOpenApiSchemaNode(schema)
    expect(schema).toEqual({ $ref: '#/components/schemas/Foo', nullable: true })
    expect(schema.type).toBeUndefined()
  })

  it('idempotent on second pass', () => {
    const schema = { type: ['string', 'null'] }
    normalizeOpenApiSchemaNode(schema)
    const snapshot = JSON.parse(JSON.stringify(schema))
    normalizeOpenApiSchemaNode(schema)
    expect(schema).toEqual(snapshot)
  })
})
