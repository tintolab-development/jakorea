import { describe, expect, it } from 'vitest'
import {
  mapPatchUserBasicInfoToAdminAccountApiRequest,
  mapPatchUserBasicInfoToApiRequest,
} from './map-patch-user-basic-info'

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

  it('선택 termsAgreements만 PATCH body에 포함하고 필수는 제외한다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      name: '김강사',
      termsAgreements: [
        { termsType: 'SERVICE_TERMS', version: '1.0', required: true, agreed: true },
        { termsType: 'MARKETING', version: '1.0', required: false, agreed: false },
      ],
    })

    expect(body.termsAgreements).toEqual([
      { termsType: 'MARKETING', version: '1.0', required: false, agreed: false },
    ])
  })

  it('반환 타입은 AdminMemberBasicInfoUpdateRequest(termsAgreements 포함)이다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      name: '김강사',
      termsAgreements: [{ termsType: 'MARKETING', version: '1.0', required: false, agreed: true }],
    })
    expect(body).toMatchObject({
      name: '김강사',
      termsAgreements: [{ termsType: 'MARKETING', version: '1.0', required: false, agreed: true }],
    })
  })
})

describe('mapPatchUserBasicInfoToAdminAccountApiRequest', () => {
  it('관리자 계정 PATCH 스키마에 termsAgreements가 없어 전송하지 않는다', () => {
    const body = mapPatchUserBasicInfoToAdminAccountApiRequest({
      name: '홍관리',
      termsAgreements: [
        { termsType: 'SERVICE_TERMS', version: '1.0', required: true, agreed: true },
        { termsType: 'MARKETING', version: '1.0', required: false, agreed: false },
      ],
    })

    expect(body).toEqual({
      name: '홍관리',
      reason: 'CMS 관리자 회원 정보 수정',
    })
    expect('termsAgreements' in body).toBe(false)
  })
})
