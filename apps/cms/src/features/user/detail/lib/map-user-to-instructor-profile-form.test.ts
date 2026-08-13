import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form'
import {
  mapInstructorFormConsentToEditableTermsAgreements,
  mapInstructorProfileFormToBasicInfoDraftPartial,
  mapUserToInstructorProfileFormValues,
} from './map-user-to-instructor-profile-form'

describe('mapUserToInstructorProfileFormValues', () => {
  it('자택 주소와 상세 주소를 수정 폼 필드에 분리한다', () => {
    const user: Omit<User, 'password'> = {
      id: 'u-1',
      memberId: 1,
      email: 'a@b.com',
      name: '김강사',
      role: 'INSTRUCTOR',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      detailAddress: '경기도 고양시 덕양구 무원로 1 (행신동)',
      detailAddressDetail: '현소네',
    }

    const values = mapUserToInstructorProfileFormValues(user, null)

    expect(values.homeAddress).toBe('경기도 고양시 덕양구 무원로 1 (행신동)')
    expect(values.homeAddressDetail).toBe('현소네')
  })

  it('교사 회원은 instructorCmsProfile.affiliation.schoolName을 schoolName에 매핑한다', () => {
    const user: Omit<User, 'password'> = {
      id: 'u-1',
      memberId: 1,
      email: 'a@b.com',
      name: '김교사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'school_teacher',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      instructorCmsProfile: {
        memberType: 'SCHOOL_TEACHER',
        affiliation: { schoolName: '진월초등학교', employmentStatus: 'ACTIVE', organizationNames: [] },
        homeAddress: { line: '' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
      },
    }

    const values = mapUserToInstructorProfileFormValues(user, null)

    expect(values.memberType).toBe('school_teacher')
    expect(values.schoolName).toBe('진월초등학교')
    expect(values.employmentStatus).toBe('ACTIVE')
  })

  it('상세 수정 draft에 termsAgreements를 포함하지 않는다 (동의는 별도 sync)', () => {
    const draft = mapInstructorProfileFormToBasicInfoDraftPartial({
      ...INITIAL_VALUES,
      name: '김강사',
      gender: 'male',
      birthDate: '1990.01.01',
      contact: '01012345678',
      email: 'a@b.com',
      consentTermsOfService: 'agree',
      consentPersonal: 'agree',
      consentMarketing: 'disagree',
    })

    expect(draft).not.toHaveProperty('termsAgreements')
  })

  it('동의 폼값 → 선택 termsAgreements 매핑 (기존 version 유지)', () => {
    const terms = mapInstructorFormConsentToEditableTermsAgreements(
      {
        consentTermsOfService: 'agree',
        consentPersonal: 'agree',
        consentMarketing: 'disagree',
        consentPortrait: 'agree',
        consentPaymentStatement: 'disagree',
        consentEducatorPledge: 'agree',
        consentAdministrativeJoint: 'disagree',
        consentSexOffenseCheck: 'agree',
      },
      [{ termsType: 'MARKETING', version: '2026-01', required: false, agreed: true }]
    )

    expect(terms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ termsType: 'MARKETING', agreed: false, version: '2026-01' }),
        expect.objectContaining({ termsType: 'PORTRAIT_RIGHTS', agreed: true }),
        expect.objectContaining({ termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: false }),
        expect.objectContaining({ termsType: 'FACILITATOR_PLEDGE', agreed: true }),
        expect.objectContaining({ termsType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: false }),
        expect.objectContaining({ termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: true }),
      ])
    )
    expect(terms?.some(r => r.termsType === 'SERVICE_TERMS')).toBe(false)
    expect(terms?.some(r => r.termsType === 'PRIVACY_COLLECTION')).toBe(false)
  })
})
