import { describe, expect, it } from 'vitest'
import { omitProgramAuditNameFields, readProgramAuditNames } from './program-audit-names'

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
