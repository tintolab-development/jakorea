import { describe, expect, it } from 'vitest'
import { mapCreateUserRequestToPreRegisterIndividual } from './map-pre-register-request'
import { ADMIN_PRE_REGISTER_TERMS_VERSION } from './build-pre-register-terms-agreements'

describe('mapCreateUserRequestToPreRegisterIndividual', () => {
  it('termsAgreements를 pre-register body에 포함한다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'user@test.com',
      password: 'TempPass1!',
      name: '홍길동',
      role: 'INDIVIDUAL',
      isActive: true,
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

    expect(body.termsAgreements).toHaveLength(2)
    expect(body.termsAgreements?.[1]).toMatchObject({
      termsType: 'MARKETING',
      agreed: true,
    })
  })

  it('선택 약관 agreed:false 는 wire에서 제외한다 (BE 400 우회)', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'user@test.com',
      password: 'TempPass1!',
      name: '홍길동',
      role: 'INDIVIDUAL',
      isActive: true,
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

    expect(body.termsAgreements?.map(row => row.termsType)).toEqual([
      'SERVICE_TERMS',
      'PRIVACY_COLLECTION',
    ])
  })

  it('재학 중이면 schoolName·enrollmentStatus·grade를 함께 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'enrolled@test.com',
      password: 'TempPass1!',
      name: '김재학',
      role: 'INDIVIDUAL',
      isActive: true,
      affiliation: '진월초등학교',
      schoolEnrollmentStatus: 'ENROLLED',
      grade: '3학년',
    })

    expect(body.schoolName).toBe('진월초등학교')
    expect(body.enrollmentStatus).toBe('ENROLLED')
    expect(body.grade).toBe('3학년')
  })

  it('미재학이면 grade를 보내지 않는다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'none@test.com',
      password: 'TempPass1!',
      name: '이미재',
      role: 'INDIVIDUAL',
      isActive: true,
      schoolEnrollmentStatus: 'NOT_ENROLLED',
      grade: '3학년',
    })

    expect(body.enrollmentStatus).toBe('NOT_ENROLLED')
    expect(body.grade).toBeUndefined()
  })

  it('재학 중 + CMS PK이면 schoolOrganizationId를 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'org@test.com',
      password: 'TempPass1!',
      name: '김재학',
      role: 'INDIVIDUAL',
      isActive: true,
      affiliation: '진월초등학교',
      schoolEnrollmentStatus: 'ENROLLED',
      grade: '3학년',
      schoolOrganizationId: 42,
    })

    expect(body.schoolOrganizationId).toBe(42)
    expect(body.schoolSelection).toBeUndefined()
  })

  it('재학 중 + NEIS 선택이면 schoolSelection을 보낸다', () => {
    const body = mapCreateUserRequestToPreRegisterIndividual({
      email: 'neis@test.com',
      password: 'TempPass1!',
      name: '박재학',
      role: 'INDIVIDUAL',
      isActive: true,
      affiliation: '서울중학교',
      schoolEnrollmentStatus: 'ENROLLED',
      grade: '2학년',
      schoolProvider: 'NEIS',
      schoolExternalCode: 'B100000658',
      schoolAddress: '서울특별시 강남구',
      schoolRegionSido: '서울특별시',
      schoolRegionSigungu: '강남구',
    })

    expect(body.schoolOrganizationId).toBeUndefined()
    expect(body.schoolSelection).toMatchObject({
      provider: 'NEIS',
      externalSchoolCode: 'B100000658',
      name: '서울중학교',
      address: '서울특별시 강남구',
    })
  })
})
