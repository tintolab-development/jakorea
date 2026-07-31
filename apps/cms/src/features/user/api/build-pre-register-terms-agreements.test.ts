import { describe, expect, it } from 'vitest'
import {
  ADMIN_PRE_REGISTER_TERMS_VERSION,
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

  it('동의서 작성형은 agree일 때만 termsAgreements에 포함한다', () => {
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
        termsType: 'EDUCATOR_PLEDGE',
        version: ADMIN_PRE_REGISTER_TERMS_VERSION,
        required: false,
        agreed: true,
      },
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
      'PAYMENT_STATEMENT',
      'EDUCATOR_PLEDGE',
      'ADMINISTRATIVE_JOINT',
      'SEX_OFFENSE_CHECK',
    ])
  })
})
