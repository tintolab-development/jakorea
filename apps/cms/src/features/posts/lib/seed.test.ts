import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listAdminFaqs } from '@/features/posts/api/admin-faq-mock-store'
import { listAdminInquiries } from '@/features/posts/api/admin-inquiry-mock-store'
import { listAdminNotices } from '@/features/posts/api/admin-notice-mock-store'
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

  it('notices payload matches admin notice mock store', () => {
    const built = buildNoticesSeedPayload()
    maybeWrite('notices-seed.payload.json', built)

    const file = readJson('notices-seed.payload.json')
    const mock = listAdminNotices()
    expect(built.meta.seedLabel).toBe(POSTS_SEED_LABEL)
    expect(built.categories).toHaveLength(8)
    expect(built.categories.map(c => c.name)).toContain('필독')
    expect(built.rows).toHaveLength(27)
    expect(built.rows).toHaveLength(mock.length)
    expect(file.rows).toHaveLength(built.rows.length)
    expect(file.rows.map((r: { seedKey: string }) => r.seedKey)).toEqual(
      built.rows.map(r => r.seedKey)
    )

    const golden = built.rows.find(r => r.seedKey === 'notice-admin-1')
    expect(golden).toMatchObject({
      title: '2025년 1월 정산 신청 기간 및 방법 안내',
      isImportant: true,
      status: 'published',
      category: '정산',
      viewCount: 1250,
      hasAttachment: true,
    })
    expect(built.rows.filter(r => r.isImportant).length).toBeGreaterThanOrEqual(3)
    expect(built.rows.some(r => r.status === '임시저장')).toBe(true)
    expect(built.rows.some(r => r.status === 'archived')).toBe(true)
  })

  it('faqs payload matches admin faq mock store', () => {
    const built = buildFaqsSeedPayload()
    maybeWrite('faqs-seed.payload.json', built)

    const file = readJson('faqs-seed.payload.json')
    const mock = listAdminFaqs()
    expect(built.categories).toHaveLength(8)
    expect(built.categories[0].name).toBe('회원가입')
    expect(built.rows).toHaveLength(130)
    expect(built.rows).toHaveLength(mock.length)
    expect(file.rows).toEqual(built.rows)
    expect(built.rows[0]).toMatchObject({
      seedKey: 'faq-admin-1',
      category: '회원가입',
      status: '임시저장',
    })
    expect(new Set(built.rows.map(r => r.category)).size).toBe(8)
  })

  it('inquiries payload matches admin inquiry mock store + id map', () => {
    const built = buildInquiriesSeedPayload()
    maybeWrite('inquiries-seed.payload.json', built)

    const file = readJson('inquiries-seed.payload.json')
    const mock = listAdminInquiries()
    expect(built.categories).toHaveLength(9)
    expect(built.rows).toHaveLength(130)
    expect(built.rows).toHaveLength(mock.length)
    expect(file.rows).toHaveLength(built.rows.length)
    expect(file.rows.map((r: { seedKey: string }) => r.seedKey)).toEqual(
      built.rows.map(r => r.seedKey)
    )

    const golden = built.rows.find(r => r.seedKey === '1')
    expect(golden).toMatchObject({
      suggestedNumericId: 1,
      title: '1365 포털에 봉사시간이 아직 안 올라왔어요.',
      status: 'ANSWERED',
      inquirerName: '서봉사',
      inquirerMemberId: 1001,
    })
    expect(golden?.answer?.content).toContain('1365')
    expect(built.rows.filter(r => r.status === 'ANSWERED').every(r => r.answer != null)).toBe(true)
    expect(built.rows.filter(r => r.status === 'PENDING').every(r => r.answer == null)).toBe(true)

    const generated = built.rows.find(r => r.seedKey === 'inq-gen-1')
    expect(generated?.suggestedNumericId).toBe(800_001)
    expect(generated?.inquirerMemberId).toBe(810_001)
  })
})
