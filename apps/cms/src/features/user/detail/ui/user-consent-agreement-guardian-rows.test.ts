import { describe, expect, it } from 'vitest'

import {
  CONSENT_PRESET_SCHEMA,
  GUARDIAN_CONSENT_LABEL,
  withGuardianConsentRows,
} from './user-consent-agreement-section'

const labelsOf = (rows: ReturnType<typeof withGuardianConsentRows>) =>
  rows.map(row => row.fields.map(field => field.label))

describe('withGuardianConsentRows (만 14세 미만 개인 회원)', () => {
  it('상단 약관 블록을 서비스·개인정보 / 법정대리인·마케팅 / 초상권 3행으로 바꾼다', () => {
    const rows = withGuardianConsentRows(CONSENT_PRESET_SCHEMA.individual)
    const upper = rows.filter(row => row.block !== 'documents')

    expect(labelsOf(upper)).toEqual([
      ['서비스 이용약관', '개인정보 수집·이용 동의'],
      [GUARDIAN_CONSENT_LABEL, '마케팅 제공 동의'],
      ['초상권 수집·이용 동의'],
    ])
    expect(upper[2]?.rowType).toBe('single')
  })

  it('하단 동의서 블록은 그대로 둔다', () => {
    const before = CONSENT_PRESET_SCHEMA.individual.filter(row => row.block === 'documents')
    const after = withGuardianConsentRows(CONSENT_PRESET_SCHEMA.individual).filter(
      row => row.block === 'documents'
    )
    expect(after).toEqual(before)
    expect(after).toHaveLength(2)
  })

  it('마케팅·초상권 행이 없는 프리셋(관리자)은 바꾸지 않는다', () => {
    expect(withGuardianConsentRows(CONSENT_PRESET_SCHEMA.admin)).toBe(CONSENT_PRESET_SCHEMA.admin)
  })
})
