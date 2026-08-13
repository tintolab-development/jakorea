import { describe, expect, it } from 'vitest'
import {
  filterEditableTermsAgreementsForBasicInfoPatch,
  isMemberBasicInfoImmutableConsentLabel,
  isMemberBasicInfoImmutableTermsType,
  mergeTermsAgreementRowsFromPatch,
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
      { termsType: 'MARKETING', version: '1', required: false, agreed: true },
    ])
  })

  it('없는 선택 동의는 기본 version으로 추가한다', () => {
    const next = upsertEditableTermsAgreementInDraft(
      undefined,
      '마케팅 제공 동의',
      true
    )
    expect(next).toEqual([
      { termsType: 'MARKETING', version: '1.0', required: false, agreed: true },
    ])
  })

  it('PATCH 선택 약관을 기존 필수 약관과 항목별로 병합한다', () => {
    const merged = mergeTermsAgreementRowsFromPatch(
      [
        { termsType: 'SERVICE_TERMS', termsVersion: '1', required: true, agreed: true },
        { termsType: 'PRIVACY_COLLECTION', termsVersion: '1', required: true, agreed: true },
        { termsType: 'MARKETING', termsVersion: '1', required: false, agreed: false },
        { termsType: 'PORTRAIT_RIGHTS', termsVersion: '1', required: false, agreed: true },
      ],
      [{ termsType: 'MARKETING', version: '1', required: false, agreed: true }]
    )

    expect(merged).toEqual([
      { termsType: 'SERVICE_TERMS', termsVersion: '1', required: true, agreed: true },
      { termsType: 'PRIVACY_COLLECTION', termsVersion: '1', required: true, agreed: true },
      { termsType: 'MARKETING', termsVersion: '1', required: false, agreed: true },
      { termsType: 'PORTRAIT_RIGHTS', termsVersion: '1', required: false, agreed: true },
    ])
  })
})
