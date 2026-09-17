import { describe, expect, it } from 'vitest'
import {
  AffiliationOrganizationDataError,
  resolveStoredAffiliation,
  toAffiliationOrganizationId,
} from './affiliation-organization'

describe('affiliation-organization', () => {
  it('null ID는 null로 유지하고 표시명만으로 ID를 만들지 않는다', () => {
    expect(toAffiliationOrganizationId(null)).toBeNull()
    expect(
      resolveStoredAffiliation({
        affiliationOrganizationId: null,
        affiliationDisplayName: '서울초등학교',
      })
    ).toEqual({
      affiliationOrganizationId: null,
      affiliation: '서울초등학교',
    })
  })

  it('known 목록에서 ID와 표시명이 서로 다른 기관이면 데이터 오류다', () => {
    expect(() =>
      resolveStoredAffiliation({
        affiliationOrganizationId: 171501,
        affiliationDisplayName: '진월초등학교',
        knownOrganizations: [
          { organizationId: 171501, name: '서울초등학교' },
          { organizationId: 171502, name: '진월초등학교' },
        ],
      })
    ).toThrow(AffiliationOrganizationDataError)
  })

  it('ID와 표시명이 같은 기관을 가리키면 통과한다', () => {
    expect(
      resolveStoredAffiliation({
        affiliationOrganizationId: 171501,
        affiliationDisplayName: '서울초등학교',
        knownOrganizations: [
          { organizationId: 171501, name: '서울초등학교' },
          { organizationId: 171502, name: '진월초등학교' },
        ],
      })
    ).toEqual({
      affiliationOrganizationId: 171501,
      affiliation: '서울초등학교',
    })
  })
})
