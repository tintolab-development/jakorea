import { describe, expect, it } from 'vitest'
import {
  filterEditableTermsAgreementsForBasicInfoPatch,
  isMemberBasicInfoImmutableConsentLabel,
  isMemberBasicInfoImmutableTermsType,
  upsertEditableTermsAgreementInDraft,
} from './member-basic-info-terms-patch'

describe('member-basic-info-terms-patch', () => {
  it('필수 termsType을 PATCH용으로 제거한다', () => {
    const filtered = filterEditableTermsAgreementsForBasicInfoPatch([
      { termsType: 'SERVICE_TERMS', version: '1', required: true, agreed: true },
      { termsType: 'MARKETING', version: '1', required: false, agreed: false },
      { termsType: 'PRIVACY_COLLECTION', version: '1', required: true, agreed: true },
    ])
    expect(filtered).toEqual([
      { termsType: 'MARKETING', version: '1', required: false, agreed: false },
    ])
  })

  it('필수 라벨·타입을 판별한다', () => {
    expect(isMemberBasicInfoImmutableTermsType('SERVICE_TERMS')).toBe(true)
    expect(isMemberBasicInfoImmutableTermsType('MARKETING')).toBe(false)
    expect(isMemberBasicInfoImmutableConsentLabel('서비스 이용약관')).toBe(true)
    expect(isMemberBasicInfoImmutableConsentLabel('마케팅 제공 동의')).toBe(false)
  })

  it('선택 동의 draft를 upsert한다', () => {
    const next = upsertEditableTermsAgreementInDraft(
      [{ termsType: 'MARKETING', version: '1', required: false, agreed: false }],
      '마케팅 제공 동의',
      true
    )
    expect(next).toEqual([
      { termsType: 'MARKETING', version: '1.0', required: false, agreed: true },
    ])
  })
})
