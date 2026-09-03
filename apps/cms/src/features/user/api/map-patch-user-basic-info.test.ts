import { describe, expect, it } from 'vitest'
import {
  mapPatchUserBasicInfoToAdminAccountApiRequest,
  mapPatchUserBasicInfoToApiRequest,
} from './map-patch-user-basic-info'
import { draftToAdminProvisionedIndividualBasicInfoPatch } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

function individualDraft(
  overrides: Partial<AdminProvisionedMemberBasicInfoDraft>
): AdminProvisionedMemberBasicInfoDraft {
  return {
    name: '홍길동',
    phone: '010-0000-0000',
    email: 'hong@example.com',
    detailAddress: '',
    affiliationInstitution: '',
    affiliationGrade: '',
    gender: '남성',
    birthDate: '1990-01-01',
    socialAccount: '',
    adminComment: '',
    ...overrides,
  }
}

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

  it('자택 주소는 개인 회원 GET·등록과 같은 address/addressDetail로 보낸다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      detailAddress: '서울특별시 관악구 관악로 1',
      detailAddressDetail: '202호',
    })

    expect(body).toMatchObject({
      detailAddress: '서울특별시 관악구 관악로 1',
      address: '서울특별시 관악구 관악로 1',
      addressDetail: '202호',
      homeAddress: '서울특별시 관악구 관악로 1',
      homeAddressDetail: '202호',
    })
  })

  it('개인 회원 소속은 GET·등록과 같은 schoolName/enrollmentStatus로 보낸다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      affiliation: '서울고등학교 | 2학년',
      individualSchoolName: '서울고등학교',
      schoolEnrollmentStatus: 'ENROLLED',
      individualGrade: '2학년',
    })

    expect(body).toMatchObject({
      affiliation: '서울고등학교 | 2학년',
      schoolName: '서울고등학교',
      enrollmentStatus: 'ENROLLED',
      grade: '2학년',
    })
  })

  it('미재학 소속은 schoolName·grade를 비우고 schoolOrganizationId null로 보낸다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      affiliation: 'JA코리아',
      individualSchoolName: '',
      schoolEnrollmentStatus: 'NOT_ENROLLED',
    })

    expect(body).toMatchObject({
      affiliation: 'JA코리아',
      schoolName: '',
      enrollmentStatus: 'NOT_ENROLLED',
      schoolOrganizationId: null,
    })
    expect(body.grade).toBe('')
  })

  it('강사 affiliation만 있으면 schoolName/enrollmentStatus extras를 넣지 않는다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      affiliation: '고양고등학교 | 재직',
    })

    expect(body.affiliation).toBe('고양고등학교 | 재직')
    expect(body.schoolName).toBeUndefined()
    expect(body.enrollmentStatus).toBeUndefined()
    expect(body.grade).toBeUndefined()
  })

  it('개인 회원 상세 초안은 schoolName/enrollmentStatus로 PATCH된다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: '서울고등학교',
        affiliationGrade: '2학년',
        schoolEnrollmentStatus: 'enrolled',
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolName).toBe('서울고등학교')
    expect(body.enrollmentStatus).toBe('ENROLLED')
    expect(body.grade).toBe('2학년')
    expect(body.affiliation).toBe('서울고등학교 | 2학년')
  })

  it('개인 회원 미재학 초안은 소속 clear payload로 PATCH된다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: 'JA코리아',
        affiliationGrade: '2학년',
        schoolEnrollmentStatus: 'not_enrolled',
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolName).toBe('')
    expect(body.enrollmentStatus).toBe('NOT_ENROLLED')
    expect(body.schoolOrganizationId).toBe(null)
    expect(body.affiliation).toBe('JA코리아')
    expect(body.grade).toBe('')
  })

  it('재학 중 + NEIS 선택 초안은 schoolSelection을 PATCH한다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: '서울중학교',
        affiliationGrade: '2학년',
        schoolEnrollmentStatus: 'enrolled',
        schoolProvider: 'NEIS',
        schoolExternalCode: 'B100000658',
        schoolEducationOfficeCode: 'B10',
        schoolAddress: '서울특별시 강남구',
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolOrganizationId).toBe(null)
    expect(body.schoolSelection).toMatchObject({
      provider: 'NEIS',
      externalSchoolCode: 'B100000658',
      educationOfficeCode: 'B10',
      name: '서울중학교',
    })
  })

  it('재학 중 + CMS PK 초안은 schoolOrganizationId를 PATCH한다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: '진월초등학교',
        affiliationGrade: '3학년',
        schoolEnrollmentStatus: 'enrolled',
        schoolOrganizationId: 42,
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolOrganizationId).toBe(42)
    expect(body.schoolSelection).toBeUndefined()
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
