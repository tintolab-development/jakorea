import { describe, expect, it } from 'vitest'
import { collectCompanySchoolRegistrationCommonState } from './collect-registration-common-info-state'
import {
  createDefaultCompanySchoolRegistrationRhfValues,
  rhfValuesFromCompanySchoolCanonical,
} from './registration-rhf-values'

describe('collectCompanySchoolRegistrationCommonState (C5)', () => {
  it('operationAnchorIso를 canonical에 담고 복원 시 RHF로 되돌린다', () => {
    const values = {
      ...createDefaultCompanySchoolRegistrationRhfValues(),
      operationAnchorIso: '2026-12-01T00:00:00.000Z',
    }
    const common = collectCompanySchoolRegistrationCommonState(values)
    expect(common.operationAnchorIso).toBe('2026-12-01T00:00:00.000Z')
    expect(rhfValuesFromCompanySchoolCanonical(common).operationAnchorIso).toBe(
      '2026-12-01T00:00:00.000Z'
    )
  })

  it('구버전 canonical(operationAnchorIso 없음)은 null로 복원한다', () => {
    const common = collectCompanySchoolRegistrationCommonState(
      createDefaultCompanySchoolRegistrationRhfValues()
    )
    delete common.operationAnchorIso
    expect(rhfValuesFromCompanySchoolCanonical(common).operationAnchorIso).toBeNull()
  })
})
