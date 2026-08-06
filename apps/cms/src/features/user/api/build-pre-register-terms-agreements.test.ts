import { describe, expect, it } from 'vitest'
import {
  ADMIN_PRE_REGISTER_TERMS_VERSION,
  buildAdminAccountCreateTermsAgreements,
  buildPreRegisterDocumentTermsAgreements,
  buildPreRegisterRadioTermsAgreements,
  buildPreRegisterTermsAgreements,
} from './build-pre-register-terms-agreements'

describe('build-pre-register-terms-agreements', () => {
  it('라디오 3건을 termsAgreements로 매핑한다', () => {
    expect(
      buildPreRegisterRadioTermsAgreements({
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

  it('동의서 작성형 — agree/disagree 모두 termsAgreements에 포함', () => {
    expect(
      buildPreRegisterDocumentTermsAgreements({
        consentPortrait: 'agree',
        consentPaymentStatement: 'disagree',
        consentEducatorPledge: 'agree',
      })
    ).toEqual([
      {
        termsType: 'PORTRAIT_RIGHTS',
        version: ADMIN_PRE_REGISTER_TERMS_VERSION,
        required: false,
        agreed: true,
      },
      {
        termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
        version: ADMIN_PRE_REGISTER_TERMS_VERSION,
        required: false,
        agreed: false,
      },
      {
        termsType: 'FACILITATOR_PLEDGE',
        version: ADMIN_PRE_REGISTER_TERMS_VERSION,
        required: false,
        agreed: true,
      },
    ])
  })

  it('개인 등록 8건 — 라디오 3 + 동의서 5 모두 agree/disagree 포함', () => {
    const rows = buildPreRegisterTermsAgreements(
      {
        consentTermsOfService: 'agree',
        consentPersonal: 'agree',
        consentMarketing: 'disagree',
      },
      {
        consentPortrait: 'agree',
        consentWithholdingTax: 'disagree',
        consentFacilitatorPledge: 'disagree',
        consentAdministrativeJoint: 'agree',
        consentSexOffenseCheck: 'disagree',
      }
    )
    expect(rows).toHaveLength(8)
    expect(rows.map(r => [r.termsType, r.agreed])).toEqual([
      ['SERVICE_TERMS', true],
      ['PRIVACY_COLLECTION', true],
      ['MARKETING', false],
      ['PORTRAIT_RIGHTS', true],
      ['PAYMENT_STATEMENT_PRE_CONSENT', false],
      ['FACILITATOR_PLEDGE', false],
      ['ADMINISTRATIVE_INFO_CONSENT', true],
      ['CRIMINAL_HISTORY_CHECK_CONSENT', false],
    ])
  })

  it('강사 등록 8건 — 라디오 3 + 동의서 5 agree 시 8 rows', () => {
    const rows = buildPreRegisterTermsAgreements(
      {
        consentTermsOfService: 'agree',
        consentPersonal: 'agree',
        consentMarketing: 'agree',
      },
      {
        consentPortrait: 'agree',
        consentPaymentStatement: 'agree',
        consentEducatorPledge: 'agree',
        consentAdministrativeJoint: 'agree',
        consentSexOffenseCheck: 'agree',
      }
    )
    expect(rows).toHaveLength(8)
    expect(rows.map(r => r.termsType)).toEqual([
      'SERVICE_TERMS',
      'PRIVACY_COLLECTION',
      'MARKETING',
      'PORTRAIT_RIGHTS',
      'PAYMENT_STATEMENT_PRE_CONSENT',
      'FACILITATOR_PLEDGE',
      'ADMINISTRATIVE_INFO_CONSENT',
      'CRIMINAL_HISTORY_CHECK_CONSENT',
    ])
  })

  it('관리자 계정 생성용 약관 4종을 매핑한다', () => {
    expect(
      buildAdminAccountCreateTermsAgreements({
        consentTermsOfService: 'agree',
        consentPersonal: 'agree',
        consentMarketing: 'disagree',
        consentMfaSetup: 'agree',
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
        termsType: 'MFA_SETUP_CONSENT',
        version: ADMIN_PRE_REGISTER_TERMS_VERSION,
        required: false,
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
})
