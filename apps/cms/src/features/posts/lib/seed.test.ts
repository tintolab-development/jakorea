import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assignedAdminNameToStubId,
  buildFaqsSeedPayload,
  buildInquiriesSeedPayload,
  buildNoticesSeedPayload,
  inquiryMockIdToMemberId,
  inquiryMockIdToSeedPk,
  POSTS_SEED_LABEL,
  toPostsApiStatus,
} from './build-seed'

const docsApiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/api')

function payloadPath(name: string) {
  return resolve(docsApiDir, name)
}

function readJson(name: string) {
  return JSON.parse(readFileSync(payloadPath(name), 'utf8'))
}

function maybeWrite(name: string, payload: unknown) {
  if (process.env.WRITE_POSTS_SEED !== '1') return
  mkdirSync(docsApiDir, { recursive: true })
  writeFileSync(payloadPath(name), `${JSON.stringify(payload, null, 2)}\n`)
}

describe('posts seed payloads', () => {
  it('maps inquiry mock ids to reserved numeric PKs and member stubs', () => {
    expect(inquiryMockIdToSeedPk('1')).toBe(1)
    expect(inquiryMockIdToSeedPk('7')).toBe(7)
    expect(inquiryMockIdToSeedPk('inq-gen-1')).toBe(800_001)
    expect(inquiryMockIdToSeedPk('inq-gen-123')).toBe(800_123)
    expect(inquiryMockIdToMemberId('1')).toBe(1_001)
    expect(inquiryMockIdToMemberId('inq-gen-1')).toBe(810_001)
    expect(assignedAdminNameToStubId('홍길동')).toBe(10)
    expect(assignedAdminNameToStubId(null)).toBeNull()
    expect(toPostsApiStatus('draft')).toBe('임시저장')
    expect(toPostsApiStatus('published')).toBe('published')
  })

  it('notices payload structure (mock store removed)', () => {
    const built = buildNoticesSeedPayload()
    maybeWrite('notices-seed.payload.json', built)

    const file = readJson('notices-seed.payload.json')
    expect(built.meta.seedLabel).toBe(POSTS_SEED_LABEL)
    expect(built.categories).toHaveLength(8)
    expect(built.categories.map(c => c.name)).toContain('필독')
    expect(built.rows).toHaveLength(0)
    expect(file.rows.length).toBeGreaterThan(0)
  })

  it('faqs payload structure (mock store removed)', () => {
    const built = buildFaqsSeedPayload()
    maybeWrite('faqs-seed.payload.json', built)
    expect(built.rows).toHaveLength(0)
    expect(built.categories.length).toBeGreaterThan(0)
  })

  it('inquiries payload structure (mock store removed)', () => {
    const built = buildInquiriesSeedPayload()
    maybeWrite('inquiries-seed.payload.json', built)
    expect(built.rows).toHaveLength(0)
  })
})
