import { describe, expect, it } from 'vitest'
import { mapPatchUserBasicInfoToApiRequest } from './map-patch-user-basic-info'

describe('mapPatchUserBasicInfoToApiRequest', () => {
  it('instructorCertifications를 instructorInfo.certifications로 매핑한다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      name: '김강사',
      instructorCertifications: [
        { id: 3, certificationName: '평생교육사', issuer: '교육부', issuedDate: '2020-01-01' },
      ],
    })

    expect(body.instructorInfo?.certifications).toEqual([
      { id: 3, certificationName: '평생교육사', issuer: '교육부', issuedDate: '2020-01-01' },
    ])
  })

  it('termsAgreements를 PATCH body에 포함한다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      name: '김강사',
      termsAgreements: [
        { termsType: 'SERVICE_TERMS', version: '1.0', required: true, agreed: true },
        { termsType: 'MARKETING', version: '1.0', required: false, agreed: false },
      ],
    })

    expect(body.termsAgreements).toEqual([
      { termsType: 'SERVICE_TERMS', version: '1.0', required: true, agreed: true },
      { termsType: 'MARKETING', version: '1.0', required: false, agreed: false },
    ])
  })
})
