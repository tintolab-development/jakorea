import { describe, expect, it } from 'vitest'
import {
  COMPANY_SCHOOL_COMMON_INFO_EXACT_KEYS,
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  projectCompanySchoolRhfToOverlayRecord,
} from './registration-rhf-values'

describe('P3/C1 1사1교 공통정보 키 커버리지', () => {
  const base = { ...createDefaultCompanySchoolRegistrationRhfValues(), paymentItemValues: [] }

  it('투영 키 = 화이트리스트(명시 RHF 필드) — overlay 전용 키 0개', () => {
    const projected = Object.keys(projectCompanySchoolRhfToOverlayRecord(base)).sort()
    expect(projected).toEqual([...COMPANY_SCHOOL_COMMON_INFO_EXACT_KEYS].sort())
  })

  it('화이트리스트 키는 sidecar로 가지 않는다(overlay → RHF → overlay 왕복)', () => {
    const overlay = projectCompanySchoolRhfToOverlayRecord({
      ...base,
      repKo: 'R',
      participantCount: 21,
      grade1Fee: 11111,
      operationAnchorIso: '2026-12-01T00:00:00.000Z',
      paymentItemValues: ['LODGING'],
    })
    const values = applyCompanySchoolRhfOverlayRecord(base, overlay)
    expect(values.sidecar).toEqual({})
    expect(projectCompanySchoolRhfToOverlayRecord(values)).toEqual(overlay)
  })

  it('화이트리스트 밖 legacy 키는 sidecar에 보존된다', () => {
    const values = applyCompanySchoolRhfOverlayRecord(base, {
      'economyRegistration.kpi.volunteer': 3,
    })
    expect(values.sidecar['economyRegistration.kpi.volunteer']).toBe(3)
  })
})
