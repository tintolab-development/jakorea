import { describe, expect, it } from 'vitest'
import {
  applyMemberConsentToSchema,
  applyTermsAgreementsToSchema,
  resolveTermsTypeToConsentLabel,
} from './map-member-consent-records'
import { CONSENT_PRESET_SCHEMA } from '@/features/user/detail/ui/user-consent-agreement-section'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'

const individualSchema = CONSENT_PRESET_SCHEMA.individual

describe('resolveTermsTypeToConsentLabel', () => {
  it('PRIVACY_COLLECTION·ADMINISTRATIVE_JOINT을 UI 라벨로 매핑한다', () => {
    expect(resolveTermsTypeToConsentLabel('PRIVACY_COLLECTION')).toBe(
      '개인정보 수집·이용 동의'
    )
    expect(resolveTermsTypeToConsentLabel('ADMINISTRATIVE_JOINT')).toBe(
      '행정정보 공동이용 사전동의서'
    )
  })

  it('등록 canonical termsType을 UI 라벨로 매핑한다', () => {
    expect(resolveTermsTypeToConsentLabel('PAYMENT_STATEMENT_PRE_CONSENT')).toBe(
      '지급조서 사전 동의서'
    )
    expect(resolveTermsTypeToConsentLabel('FACILITATOR_PLEDGE')).toBe('교육진행자 서약서')
    expect(resolveTermsTypeToConsentLabel('ADMINISTRATIVE_INFO_CONSENT')).toBe(
      '행정정보 공동이용 사전동의서'
    )
    expect(resolveTermsTypeToConsentLabel('CRIMINAL_HISTORY_CHECK_CONSENT')).toBe(
      '성범죄 경력 조회 동의서'
    )
  })
})

describe('applyTermsAgreementsToSchema', () => {
  it('termsAgreements agreed true/false를 항목별로 반영한다', () => {
    const rows = applyTermsAgreementsToSchema(individualSchema, [
      { termsType: 'SERVICE_TERMS', agreed: true, agreedAt: '2026-01-15T09:15:42Z' },
      { termsType: 'PRIVACY_COLLECTION', agreed: false },
      { termsType: 'MARKETING', agreed: true },
      { termsType: 'PORTRAIT_RIGHTS', agreed: false },
      { termsType: 'PAYMENT_STATEMENT', agreed: true },
      { termsType: 'EDUCATOR_PLEDGE', agreed: false },
    ])

    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('서비스 이용약관')).toMatchObject({
      type: 'remote_consent',
      agreed: true,
    })
    expect(field('개인정보 수집·이용 동의')).toMatchObject({
      type: 'remote_consent',
      agreed: false,
    })
    expect(field('마케팅 제공 동의')).toMatchObject({
      type: 'remote_consent',
      agreed: true,
    })
    expect(field('초상권 수집·이용 동의')).toMatchObject({
      type: 'document',
      agreed: false,
    })
    expect(field('지급조서 사전 동의서')).toMatchObject({ type: 'document', agreed: true })
    expect(field('교육진행자 서약서')).toMatchObject({ type: 'document', agreed: false })
  })

  it('교사(비겸직) preset에는 강사 전용 동의 항목이 없다', () => {
    const schoolTeacherSchema = CONSENT_PRESET_SCHEMA.school_teacher
    const rows = applyTermsAgreementsToSchema(schoolTeacherSchema, [
      { termsType: 'PAYMENT_STATEMENT', agreed: true },
      { termsType: 'EDUCATOR_PLEDGE', agreed: true },
    ])
    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('지급조서 사전 동의서')).toBeUndefined()
    expect(field('교육진행자 서약서')).toBeUndefined()
  })

  it('등록 canonical termsType(상세 조회)을 동의 상태로 반영한다', () => {
    const instructorSchema = CONSENT_PRESET_SCHEMA.instructor_only
    const rows = applyTermsAgreementsToSchema(instructorSchema, [
      { termsType: 'SERVICE_TERMS', agreed: true },
      { termsType: 'PRIVACY_COLLECTION', agreed: true },
      { termsType: 'MARKETING', agreed: true },
      { termsType: 'PORTRAIT_RIGHTS', agreed: true },
      { termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: true },
      { termsType: 'FACILITATOR_PLEDGE', agreed: true },
      { termsType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: true },
      { termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: true },
    ])

    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('서비스 이용약관')).toMatchObject({ agreed: true })
    expect(field('지급조서 사전 동의서')).toMatchObject({ type: 'document', agreed: true })
    expect(field('교육진행자 서약서')).toMatchObject({ type: 'document', agreed: true })
    expect(field('행정정보 공동이용 사전동의서')).toMatchObject({
      type: 'document',
      agreed: true,
    })
    expect(field('성범죄 경력 조회 동의서')).toMatchObject({ type: 'document', agreed: true })
  })

  it('데이터가 없으면 mock 샘플 대신 미동의 기본값을 사용한다', () => {
    const rows = applyTermsAgreementsToSchema(individualSchema, [])

    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('서비스 이용약관')).toMatchObject({ agreed: false })
    expect(field('개인정보 수집·이용 동의')).toMatchObject({ agreed: false })
  })
})

describe('applyMemberConsentToSchema', () => {
  it('Summary agreed가 consent-records 이력(과거 false)보다 우선한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        { consentType: 'MARKETING', agreed: true, agreedAt: '2026-03-01T00:00:00Z' },
      ],
      consentRecords: [
        { consentType: 'MARKETING', consentValue: false, consentedAt: '2026-02-01T00:00:00Z' },
      ],
    })

    const marketing = rows.flatMap(r => r.fields).find(f => f.label === '마케팅 제공 동의')?.value
    expect(marketing).toMatchObject({ type: 'remote_consent', agreed: true })
  })

  it('consent-records의 filledDocumentAvailable·formResponseId를 Summary agreed 위에 보강한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        {
          consentType: 'PORTRAIT_RIGHTS',
          agreed: true,
          agreedAt: '2026-01-15T09:15:42Z',
        },
      ],
      consentRecords: [
        {
          consentType: 'PORTRAIT_RIGHTS',
          consentRecordId: 50,
          consentedAt: '2026-01-14T09:15:42Z',
          formResponseId: 41,
        },
        {
          consentType: 'PORTRAIT_RIGHTS',
          consentRecordId: 51,
          consentedAt: '2026-01-15T09:15:42Z',
          consentValue: false,
          formResponseId: 42,
          filledDocumentId: 7,
          filledDocumentAvailable: true,
          filledDocumentRevealEndpoint:
            '/api/admin/users/1/consent-records/PORTRAIT_RIGHTS/filled-document',
        },
      ],
    })

    const portrait = rows
      .flatMap(r => r.fields)
      .find(f => f.label === '초상권 수집·이용 동의')?.value

    expect(portrait).toMatchObject({
      type: 'document',
      agreed: true,
      formResponseId: 42,
      filledDocumentId: 7,
      filledDocumentAvailable: true,
      filledDocumentRevealEndpoint:
        '/api/admin/users/1/consent-records/PORTRAIT_RIGHTS/filled-document',
      consentType: 'PORTRAIT_RIGHTS',
    })
    if (portrait?.type === 'document') {
      expect(portrait.consentRecordId).toBe(51)
    } else {
      throw new Error('Expected portrait consent to remain a document value')
    }
  })

  it('관리자 상세 termsAgreements 경로에서 records 메타를 보강한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      termsAgreements: [
        { termsType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: true, agreedAt: '2026-03-01T00:00:00Z' },
      ],
      consentRecords: [
        {
          consentType: 'ADMINISTRATIVE_INFO_CONSENT',
          consentValue: true,
          formResponseId: 88,
        },
      ],
    })

    const notice = rows
      .flatMap(r => r.fields)
      .find(f => f.label === '행정정보 공동이용 사전동의서')?.value

    expect(notice).toMatchObject({
      type: 'document',
      agreed: true,
      formResponseId: 88,
      consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    })
  })

  it('records만 있으면 동의 여부를 계산하지 않는다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentRecords: [
        {
          consentType: 'PORTRAIT_RIGHTS',
          consentValue: true,
          consentedAt: '2026-01-15T09:15:42Z',
          formResponseId: 42,
        },
      ],
    })

    const portrait = rows
      .flatMap(r => r.fields)
      .find(f => f.label === '초상권 수집·이용 동의')?.value

    expect(portrait).toMatchObject({
      type: 'document',
      agreed: false,
    })
  })

  it('Summary termsType 별칭(TERMS)을 서비스 이용약관 라벨에 매핑한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        { consentType: 'TERMS', agreed: true, agreedAt: '2026-01-15T09:15:42Z' },
      ],
    })

    expect(
      rows.flatMap(r => r.fields).find(f => f.label === '서비스 이용약관')?.value
    ).toMatchObject({ type: 'remote_consent', agreed: true })
  })

  it('신청 스냅샷 consentRecordId와 records 작성본 메타를 동의서 보기에 붙인다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      termsAgreements: [
        {
          termsType: 'FACILITATOR_PLEDGE',
          agreed: true,
          agreedAt: '2026-03-01T09:15:42Z',
          consentRecordId: 81,
        } as TermsAgreementRow & { consentRecordId: number },
      ],
      consentRecords: [
        {
          consentType: 'FACILITATOR_PLEDGE',
          consentRecordId: 81,
          formResponseId: 12,
          filledDocumentId: 9001,
          filledDocumentAvailable: true,
        },
      ],
    })

    const pledge = rows.flatMap(r => r.fields).find(f => f.label === '교육진행자 서약서')?.value
    expect(pledge).toMatchObject({
      type: 'document',
      agreed: true,
      consentRecordId: 81,
      formResponseId: 12,
      filledDocumentId: 9001,
      filledDocumentAvailable: true,
    })
  })

  it('지급조서 PRE_CONSENT summary를 UI 지급조서 항목 하나에 매핑한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        { consentType: 'PAYMENT_STATEMENT_CONSENT', agreed: true, agreedAt: '2026-01-01T00:00:00Z' },
      ],
    })

    const payment = rows
      .flatMap(r => r.fields)
      .find(f => f.label === '지급조서 사전 동의서')?.value

    expect(payment).toMatchObject({ type: 'document', agreed: true })
  })
})
