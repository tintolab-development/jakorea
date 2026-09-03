import { describe, expect, it } from 'vitest'
import { mapCreateUserRequestToPreRegisterIndividual } from './map-pre-register-request'
import { ADMIN_PRE_REGISTER_TERMS_VERSION } from './build-pre-register-terms-agreements'
import type { CreateUserRequest } from '@/entities/user/api/user-service'

function individualRequest(overrides: Partial<CreateUserRequest> = {}): CreateUserRequest {
  return {
    email: 'user@test.com',
    password: 'TempPass1!',
    name: '홍길동',
    phone: '010-0000-0000',
    gender: '남성',
    birthDate: '1998-12-12',
    address: '서울특별시 강남구',
    role: 'INDIVIDUAL',
    isActive: true,
    schoolEnrollmentStatus: 'NOT_ENROLLED',
    ...overrides,
  }
}

describe('mapCreateUserRequestToPreRegisterIndividual', () => {
  it('termsAgreements를 pre-register body에 포함한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        termsAgreements: [
          {
            termsType: 'SERVICE_TERMS',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: true,
            agreed: true,
          },
          {
            termsType: 'MARKETING',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: false,
            agreed: true,
          },
        ],
      })
    )

    expect(body.termsAgreements).toHaveLength(2)
    expect(body.termsAgreements?.[1]).toMatchObject({
      termsType: 'MARKETING',
      agreed: true,
    })
  })

  it('선택 약관 agreed:false 도 wire에 포함한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        termsAgreements: [
          {
            termsType: 'SERVICE_TERMS',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: true,
            agreed: true,
          },
          {
            termsType: 'PRIVACY_COLLECTION',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: true,
            agreed: true,
          },
          {
            termsType: 'MARKETING',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: false,
            agreed: false,
          },
          {
            termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            required: false,
            agreed: false,
          },
        ],
      })
    )

    expect(body.termsAgreements?.map(row => row.termsType)).toEqual([
      'SERVICE_TERMS',
      'PRIVACY_COLLECTION',
      'MARKETING',
      'PAYMENT_STATEMENT_PRE_CONSENT',
    ])
    expect(body.termsAgreements?.find(row => row.termsType === 'MARKETING')).toMatchObject({
      agreed: false,
      required: false,
    })
  })

  it('재학 중이면 schoolName·enrollmentStatus·grade를 함께 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'enrolled@test.com',
        name: '김재학',
        affiliation: '진월초등학교',
        schoolEnrollmentStatus: 'ENROLLED',
        grade: '3학년',
      })
    )

    expect(body.schoolName).toBe('진월초등학교')
    expect(body.enrollmentStatus).toBe('ENROLLED')
    expect(body.grade).toBe('3학년')
    expect(body.schoolSelection).toBeUndefined()
    expect(body.affiliationName).toBeUndefined()
  })

  it('미재학이면 grade·schoolName을 보내지 않고 affiliationName만 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'none@test.com',
        name: '이미재',
        schoolEnrollmentStatus: 'NOT_ENROLLED',
        affiliation: '지역아동센터',
        grade: '3학년',
      })
    )

    expect(body.enrollmentStatus).toBe('NOT_ENROLLED')
    expect(body.grade).toBeUndefined()
    expect(body.schoolName).toBeUndefined()
    expect(body.schoolSelection).toBeUndefined()
    expect(body.affiliationName).toBe('지역아동센터')
  })

  it('재학 중 + CMS PK이면 schoolOrganizationId를 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'org@test.com',
        name: '김재학',
        affiliation: '진월초등학교',
        schoolEnrollmentStatus: 'ENROLLED',
        grade: '3학년',
        schoolOrganizationId: 42,
      })
    )

    expect(body.schoolOrganizationId).toBe(42)
    expect(body.schoolSelection).toBeUndefined()
  })

  it('재학 중 + NEIS 선택이면 schoolSelection을 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'neis@test.com',
        name: '박재학',
        affiliation: '서울중학교',
        schoolEnrollmentStatus: 'ENROLLED',
        grade: '2학년',
        schoolProvider: 'NEIS',
        schoolExternalCode: 'B100000658',
        schoolEducationOfficeCode: 'B10',
        schoolAddress: '서울특별시 강남구',
        schoolRegionSido: '서울특별시',
        schoolRegionSigungu: '강남구',
      })
    )

    expect(body.schoolOrganizationId).toBeUndefined()
    expect(body.schoolSelection).toMatchObject({
      provider: 'NEIS',
      externalSchoolCode: 'B100000658',
      educationOfficeCode: 'B10',
      name: '서울중학교',
      address: '서울특별시 강남구',
    })
  })

  it('NEIS 선택 시 schoolEducationOfficeCode를 educationOfficeCode로 우선한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'neis-office@test.com',
        name: '박재학',
        affiliation: '서울중학교',
        schoolEnrollmentStatus: 'ENROLLED',
        grade: '2학년',
        schoolProvider: 'NEIS',
        schoolExternalCode: 'B100000658',
        schoolEducationOfficeCode: 'B10',
      })
    )

    expect(body.schoolSelection?.educationOfficeCode).toBe('B10')
  })

  it('재학 중 + CareerNet 선택이면 educationOfficeCode를 보내지 않는다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest({
        email: 'univ@test.com',
        name: '이재학',
        affiliation: '서울대학교 (관악)',
        schoolEnrollmentStatus: 'ENROLLED',
        grade: '1학년',
        schoolProvider: 'CAREER_NET',
        schoolExternalCode: '1',
        schoolAddress: '서울특별시 관악구',
        schoolRegionSido: '서울특별시',
      })
    )

    expect(body.schoolSelection).toMatchObject({
      provider: 'CAREER_NET',
      externalSchoolCode: '1',
      name: '서울대학교 (관악)',
    })
    expect(body.schoolSelection?.educationOfficeCode).toBeUndefined()
  })
})
