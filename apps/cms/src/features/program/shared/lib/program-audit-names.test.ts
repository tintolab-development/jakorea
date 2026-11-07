import { describe, expect, it } from 'vitest'
import {
  omitProgramAuditNameFields,
  readProgramAuditNames,
  withExpectedUpdatedAt,
} from './program-audit-names'

describe('readProgramAuditNames', () => {
  it('reads trimmed names from a detail payload', () => {
    expect(
      readProgramAuditNames({
        createdByName: ' 곽도규 ',
        updatedByName: '김도영',
      })
    ).toEqual({ createdByName: '곽도규', updatedByName: '김도영' })
  })

  it('omits blank names so the UI can show -', () => {
    expect(readProgramAuditNames({ createdByName: '  ', updatedByName: '' })).toEqual({})
    expect(readProgramAuditNames({ createdAt: '2026-12-08T00:15:00.000Z' })).toEqual({})
    expect(readProgramAuditNames({ createdByName: null, updatedByName: null })).toEqual({})
  })

  it('strips audit names from nested JSON so top-level ProgramResponse wins', () => {
    expect(
      omitProgramAuditNameFields({
        title: '예시',
        createdByName: 'JSON등록',
        updatedByName: 'JSON수정',
      })
    ).toEqual({ title: '예시' })
  })
})

describe('withExpectedUpdatedAt', () => {
  it('adds GET updatedAt for program PATCH lock', () => {
    expect(withExpectedUpdatedAt({ title: '예시' }, ' 2026-11-01T00:00:00+09:00 ')).toEqual({
      title: '예시',
      expectedUpdatedAt: '2026-11-01T00:00:00+09:00',
    })
  })

  it('omits expectedUpdatedAt when GET updatedAt is missing', () => {
    expect(withExpectedUpdatedAt({ title: '예시' }, undefined)).toEqual({ title: '예시' })
    expect(withExpectedUpdatedAt({ title: '예시' }, '  ')).toEqual({ title: '예시' })
  })

  it('serializes Date updatedAt to ISO', () => {
    expect(withExpectedUpdatedAt({ title: '예시' }, new Date('2026-11-01T00:00:00.000Z'))).toEqual({
      title: '예시',
      expectedUpdatedAt: '2026-11-01T00:00:00.000Z',
    })
  })

  it('keeps GET updatedAt microseconds instead of Date.toISOString truncation', () => {
    const getUpdatedAt = '2026-10-31T12:10:00.059740Z'
    expect(withExpectedUpdatedAt({ title: '예시' }, getUpdatedAt).expectedUpdatedAt).toBe(
      getUpdatedAt
    )
    expect(new Date(getUpdatedAt).toISOString()).toBe('2026-10-31T12:10:00.059Z')
  })
})
