import { describe, expect, it } from 'vitest'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import type { InstructorRegisterValidationInput } from '@jakorea/domain/instructor/validate-register'
import { getInstructorRequiredConsentAgreeKeys } from '@jakorea/domain/instructor/form-layout'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
} from '@jakorea/domain/shared/required-consent-alert'
import { INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS } from '@jakorea/domain/instructor/consent'

function baseValues(
  overrides: Partial<InstructorRegisterValidationInput> = {}
): InstructorRegisterValidationInput {
  return {
    name: '홍길동',
    gender: 'male',
    birthDate: '1990-01-01',
    contact: '010-1234-5678',
    email: 'test@example.com',
    memberType: 'general',
    schoolName: '',
    employmentStatus: '',
    affiliationName: 'JA',
    affiliationNone: false,
    homeAddress: '서울시',
    homeAddressDetail: '101호',
    instructorCareer: '경력',
    bankName: '국민',
    accountNumber: '123',
    accountHolder: '홍길동',
    isBusinessIncome: 'yes',
    oneLineIntro: '소개',
    consentTermsOfService: 'agree',
    consentPersonal: 'agree',
    consentMarketing: 'disagree',
    consentPortrait: 'disagree',
    consentPaymentStatement: 'disagree',
    consentEducatorPledge: 'disagree',
    consentAdministrativeJoint: 'disagree',
    consentSexOffenseCheck: 'disagree',
    eduSchoolType: '',
    eduStatus: '',
    educationDetailKeys: [],
    highSchool: { admitYear: null, gradYear: null, schoolName: '', major: '' },
    college23Rows: [],
    college4Rows: [],
    graduateRows: [],
    careerLevel: 'new',
    careers: [],
    freeWrite1: '',
    freeWrite2: '',
    freeWrite3: '',
    freeWrite4: '',
    ...overrides,
  }
}

describe('instructor register consent validation', () => {
  it('선택 동의 미동의만으로는 필수 누락이 되지 않는다', () => {
    const result = collectInstructorRegisterValidation(
      baseValues({
        consentMarketing: 'disagree',
        consentPortrait: 'disagree',
        consentPaymentStatement: 'disagree',
      })
    )
    expect(result.missingRequired).toBe(false)
  })

  it('Platform 강사 신청 필수 동의 키는 강사 신규 등록과 동일하다', () => {
    expect([...getInstructorRequiredConsentAgreeKeys('platformApply')]).toEqual([
      ...getInstructorRequiredConsentAgreeKeys('cmsRegister'),
    ])
  })

  it('동의서 미작성(미동의)만으로는 Platform 강사 신청 필수 누락이 되지 않는다', () => {
    const result = collectInstructorRegisterValidation(
      baseValues({
        consentPaymentStatement: 'disagree',
        consentEducatorPledge: 'disagree',
        consentAdministrativeJoint: 'disagree',
        consentSexOffenseCheck: 'disagree',
      }),
      {},
      {
        requiredConsentAgreeKeys: [...getInstructorRequiredConsentAgreeKeys('platformApply')],
      }
    )
    expect(result.missingRequired).toBe(false)
  })

  it('필수 동의 미동의 시 팝업 문구에 항목명이 포함된다', () => {
    const values = baseValues({
      consentTermsOfService: 'disagree',
      consentPersonal: 'disagree',
    })
    const labels = collectDisagreedRequiredConsentLabels(values, [
      { key: 'consentTermsOfService', label: '서비스 이용약관' },
      { key: 'consentPersonal', label: '개인정보 수집·이용 동의' },
    ])
    expect(REQUIRED_CONSENT_DISAGREE_ALERT_TITLE).toBe('필수 동의 항목 안내')
    expect(buildRequiredConsentDisagreeAlertMessage(labels)).toBe(
      '서비스 이용약관, 개인정보 수집·이용 동의에 동의하지 않을 경우, 가입이 불가합니다.'
    )
    expect(collectInstructorRegisterValidation(values).missingRequired).toBe(true)
  })

  it('약관·동의 라디오 미선택 시 hasUnsetConsentSelections가 true다', () => {
    expect(
      hasUnsetConsentSelections(
        baseValues({
          consentTermsOfService: undefined,
          consentPersonal: undefined,
          consentMarketing: undefined,
          consentPortrait: undefined,
          consentPaymentStatement: undefined,
          consentEducatorPledge: undefined,
          consentAdministrativeJoint: undefined,
          consentSexOffenseCheck: undefined,
        }),
        INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS
      )
    ).toBe(true)

    expect(
      hasUnsetConsentSelections(
        baseValues({
          consentTermsOfService: 'agree',
          consentPersonal: 'agree',
          consentMarketing: 'disagree',
          consentPortrait: 'disagree',
          consentPaymentStatement: 'disagree',
          consentEducatorPledge: 'disagree',
          consentAdministrativeJoint: 'disagree',
          consentSexOffenseCheck: 'disagree',
        }),
        INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS
      )
    ).toBe(false)
  })
})
