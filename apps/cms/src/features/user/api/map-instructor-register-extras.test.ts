import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  ADMIN_PRE_REGISTER_TERMS_VERSION,
  buildInstructorRegisterCertifications,
  buildInstructorRegisterEducationLevel,
  buildInstructorRegisterTermsAgreements,
} from '@/features/user/api/map-instructor-register-extras'

describe('map-instructor-register-extras', () => {
  it('서비스·개인정보·마케팅 동의를 termsAgreements로 매핑한다', () => {
    expect(
      buildInstructorRegisterTermsAgreements({
        consentTermsOfService: 'agree',
        consentPersonal: 'agree',
        consentMarketing: 'disagree',
      })
    ).toEqual([
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
    ])
  })

  it('자격증 제목이 있는 행만 certifications로 매핑한다', () => {
    expect(
      buildInstructorRegisterCertifications([
        { title: '  CompTIA  ', issuer: 'CompTIA', acquiredYear: dayjs('2020-05-01') },
        { title: '', issuer: '무시', acquiredYear: null },
        { title: '교원자격증', issuer: '', acquiredYear: null },
      ])
    ).toEqual([
      {
        certificationName: 'CompTIA',
        issuer: 'CompTIA',
        issuedDate: '2020-01-01',
      },
      {
        certificationName: '교원자격증',
      },
    ])
  })

  it('학력 유형·상태를 educationLevel 요약으로 합친다', () => {
    expect(
      buildInstructorRegisterEducationLevel({
        eduSchoolType: '대학교',
        eduStatus: '졸업',
      })
    ).toBe('대학교 / 졸업')
    expect(buildInstructorRegisterEducationLevel({ eduSchoolType: '', eduStatus: '' })).toBeUndefined()
  })
})
