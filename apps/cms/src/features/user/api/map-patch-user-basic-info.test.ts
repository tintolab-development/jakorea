import { describe, expect, it } from 'vitest'
import {
  mapPatchUserBasicInfoToAdminAccountApiRequest,
  mapPatchUserBasicInfoToApiRequest,
} from './map-patch-user-basic-info'
import {
  applyJaEvaluationGradeToInstructorDraft,
  applyInstructorFeeGradeToInstructorDraft,
  draftToAdminAccountBasicInfoPatch,
  draftToAdminProvisionedIndividualBasicInfoPatch,
  draftToAdminProvisionedInstructorBasicInfoPatch,
  draftToInstructorFeeAndJaGradePatch,
  mergeInstructorDetailEditFlushIntoDraft,
} from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

function instructorDraft(
  overrides: Partial<AdminProvisionedMemberBasicInfoDraft>
): AdminProvisionedMemberBasicInfoDraft {
  return {
    name: '김강사',
    phone: '010-0000-0000',
    email: 'a@b.com',
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
  it('강사 상세 PATCH에 계좌 키를 넣지 않는다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      name: '김강사',
      instructorInfo: {
        bankName: '국민',
        accountNumber: '************',
        accountHolder: '김**',
        isBusinessIncome: true,
      },
      instructorCmsSettlement: {
        bankName: '국민',
        accountNumber: '************',
        accountHolder: '김**',
        businessIncome: true,
        bankAccounts: [],
      },
    })

    expect(body.instructorInfo).toEqual({ isBusinessIncome: true })
    expect(body.settlement).toEqual({ businessIncome: true })
    expect(body.instructorInfo).not.toHaveProperty('bankName')
    expect(body.settlement).not.toHaveProperty('bankAccounts')
  })

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

  it('미재학 소속은 schoolName에 소속명을 넣고 schoolOrganizationId null로 보낸다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      affiliation: 'JA코리아',
      individualSchoolName: '',
      schoolEnrollmentStatus: 'NOT_ENROLLED',
    })

    expect(body).toMatchObject({
      affiliation: 'JA코리아',
      schoolName: 'JA코리아',
      enrollmentStatus: 'NOT_ENROLLED',
      schoolOrganizationId: null,
    })
    expect(body.grade).toBe('')
  })

  it('자택 우편번호·1365를 PATCH body에 포함한다', () => {
    const body = mapPatchUserBasicInfoToApiRequest({
      detailAddress: '서울특별시 관악구 관악로 1',
      detailAddressDetail: '202호',
      zipCode: '08787',
      id1365: '13650001',
    })

    expect(body).toMatchObject({
      address: '서울특별시 관악구 관악로 1',
      addressDetail: '202호',
      zipCode: '08787',
      external1365Id: '13650001',
    })
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

    expect(body.schoolName).toBe('JA코리아')
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

  it('재학 중 + CareerNet 초안은 CAREER_NET schoolSelection을 PATCH한다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: '서울교육대학교',
        affiliationGrade: '1학년',
        schoolEnrollmentStatus: 'enrolled',
        schoolProvider: 'CAREER_NET',
        schoolExternalCode: '1',
        schoolAddress: '서울특별시',
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolName).toBe('서울교육대학교')
    expect(body.schoolSelection).toMatchObject({
      provider: 'CAREER_NET',
      externalSchoolCode: '1',
      name: '서울교육대학교',
    })
    expect(body.schoolSelection?.educationOfficeCode).toBeUndefined()
  })

  it('재학 중 + 학교명만 초안은 schoolSelection을 보내지 않는다', () => {
    const patch = draftToAdminProvisionedIndividualBasicInfoPatch(
      individualDraft({
        affiliationInstitution: '서울교육대학교',
        affiliationGrade: '1학년',
        schoolEnrollmentStatus: 'enrolled',
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.schoolName).toBe('서울교육대학교')
    expect(body.schoolSelection).toBeUndefined()
    // 기존 CMS 학교 연동을 지우지 않도록 null도 보내지 않는다
    expect(body.schoolOrganizationId).toBeUndefined()
  })

  it('강사 상세 저장은 성명·소속·자택주소 상세를 PATCH body에 넣는다', () => {
    const draft = instructorDraft({
      name: '박신규',
      affiliationInstitution: '제미나이 강사단',
      detailAddress: '예전 도로명',
      detailAddressSearch: '서울특별시 강남구 테헤란로 1',
      detailAddressDetail: '10층',
      instructorCmsProfile: {
        memberType: 'GENERAL',
        affiliation: { organizationNames: ['제미나이 강사단'] },
        homeAddress: { line: '서울특별시 강남구 테헤란로 1', detail: '10층' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
      },
    })
    const patch = draftToAdminProvisionedInstructorBasicInfoPatch(draft)
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.name).toBe('박신규')
    expect(body.affiliation).toBe('제미나이 강사단')
    expect(body.detailAddress).toBe('서울특별시 강남구 테헤란로 1')
    expect(body.addressDetail).toBe('10층')
    expect(body.homeAddressDetail).toBe('10층')
    expect(body.profile?.affiliation?.organizationNames).toEqual(['제미나이 강사단'])
    expect(body.profile?.homeAddress).toEqual({
      line: '서울특별시 강남구 테헤란로 1',
      detail: '10층',
    })
  })

  it('강사 상세 저장 PATCH에는 JA 등급을 넣지 않는다 (평가 모달 전용)', () => {
    const draft = applyJaEvaluationGradeToInstructorDraft(
      instructorDraft({
        jaEvaluationGrade: 'A',
        instructorCmsProfile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
          defaultJaGrade: 'A',
        },
      }),
      'S'
    )
    const patch = draftToAdminProvisionedInstructorBasicInfoPatch(draft)
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    // draft UI 상태는 평가 모달 반영값을 유지하되, basic-info 저장 wire에는 실리지 않음
    expect(draft.jaEvaluationGrade).toBe('S')
    expect(draft.instructorCmsProfile?.defaultJaGrade).toBe('S')
    expect(patch.listMetrics?.jaEvaluationGrade).toBeUndefined()
    expect(patch.instructorCmsProfile?.defaultJaGrade).toBeUndefined()
    expect(body.profile?.defaultJaGrade).toBeUndefined()
    expect(body.listMetrics?.jaEvaluationGrade).toBeUndefined()
  })

  it('강사 상세 저장은 draft 강사비 등급으로 profile.defaultFeeGrade·feeGrade를 덮어쓴다', () => {
    const draft = applyInstructorFeeGradeToInstructorDraft(
      instructorDraft({
        instructorFeeGrade: '2급 강사비',
        instructorCmsProfile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
          defaultFeeGrade: '2급 강사비',
        },
      }),
      '1급 강사비'
    )
    const patch = draftToAdminProvisionedInstructorBasicInfoPatch(draft)
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(draft.instructorFeeGrade).toBe('1급 강사비')
    expect(draft.instructorCmsProfile?.defaultFeeGrade).toBe('1급 강사비')
    expect(patch.listMetrics?.instructorFeeGradeLabel).toBe('1급 강사비')
    expect(patch.instructorCmsProfile?.defaultFeeGrade).toBe('1급 강사비')
    expect(body.profile?.defaultFeeGrade).toBe('1')
    expect(body.feeGrade).toBe('1')
    expect(body.listMetrics?.instructorFeeGradeLabel).toBe('1급 강사비')
  })

  it('폼 flush의 예전 강사비 등급은 draft 셀렉트 값을 덮지 않는다', () => {
    const draft = instructorDraft({
      instructorFeeGrade: '1급 강사비',
      instructorCmsProfile: {
        memberType: 'GENERAL',
        affiliation: { organizationNames: [] },
        homeAddress: { line: '' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
        defaultFeeGrade: '2급 강사비',
      },
    })
    const merged = mergeInstructorDetailEditFlushIntoDraft(draft, {
      instructorFeeGrade: '2급 강사비',
      instructorCmsProfile: {
        memberType: 'GENERAL',
        affiliation: { organizationNames: [] },
        homeAddress: { line: '' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
        defaultFeeGrade: '2급 강사비',
      },
    })
    const body = mapPatchUserBasicInfoToApiRequest(
      draftToAdminProvisionedInstructorBasicInfoPatch(merged)
    )

    expect(merged.instructorFeeGrade).toBe('1급 강사비')
    expect(merged.instructorCmsProfile?.defaultFeeGrade).toBe('1급 강사비')
    expect(body.profile?.defaultFeeGrade).toBe('1')
    expect(body.feeGrade).toBe('1')
  })

  it('강사비 제한 수정도 profile.defaultFeeGrade와 feeGrade를 보내고 JA 등급은 제외한다', () => {
    const patch = draftToInstructorFeeAndJaGradePatch(
      instructorDraft({
        instructorFeeGrade: '3급 강사비',
        jaEvaluationGrade: 'A',
        instructorCmsProfile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
          defaultFeeGrade: '2급 강사비',
          defaultJaGrade: 'A',
        },
      })
    )
    const body = mapPatchUserBasicInfoToApiRequest(patch)

    expect(body.listMetrics?.instructorFeeGradeLabel).toBe('3급 강사비')
    expect(body.listMetrics?.jaEvaluationGrade).toBeUndefined()
    expect(body.profile?.defaultFeeGrade).toBe('3')
    expect(body.profile?.defaultJaGrade).toBeUndefined()
    expect(body.feeGrade).toBe('3')
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
      reason: '회원 정보 수정',
    })
    expect('termsAgreements' in body).toBe(false)
  })
})

describe('관리자 계정 이메일 수정 (관리자 등록·본인인증 전)', () => {
  it('바뀐 이메일은 관리자 계정 PATCH body에 담는다', () => {
    const patch = draftToAdminAccountBasicInfoPatch(
      instructorDraft({ email: 'new@jakorea.org', emailOriginal: 'old@jakorea.org' })
    )
    expect(patch.email).toBe('new@jakorea.org')
    expect(mapPatchUserBasicInfoToAdminAccountApiRequest(patch)).toMatchObject({
      email: 'new@jakorea.org',
      reason: '회원 정보 수정',
    })
  })

  it('이메일이 그대로면(대소문자·공백 차이 포함) 보내지 않는다', () => {
    const patch = draftToAdminAccountBasicInfoPatch(
      instructorDraft({ email: ' Old@JAKorea.org ', emailOriginal: 'old@jakorea.org' })
    )
    expect('email' in patch).toBe(false)
    expect('email' in mapPatchUserBasicInfoToAdminAccountApiRequest(patch)).toBe(false)
  })

  it('이메일을 비우면 보내지 않는다', () => {
    const patch = draftToAdminAccountBasicInfoPatch(
      instructorDraft({ email: '', emailOriginal: 'old@jakorea.org' })
    )
    expect('email' in patch).toBe(false)
  })

  it('바뀐 이메일은 서버 저장 규칙에 맞춰 소문자로 보낸다', () => {
    const patch = draftToAdminAccountBasicInfoPatch(
      instructorDraft({ email: ' New.Admin@JAKorea.org ', emailOriginal: 'old@jakorea.org' })
    )
    expect(patch.email).toBe('new.admin@jakorea.org')
  })
})
