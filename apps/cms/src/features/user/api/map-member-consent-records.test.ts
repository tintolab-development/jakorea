import { describe, expect, it } from 'vitest'
import {
  applyMemberConsentToSchema,
  applyTermsAgreementsToSchema,
  resolveConsentSummaryStatusState,
  resolveTermsTypeToConsentLabel,
} from './map-member-consent-records'
import { CONSENT_PRESET_SCHEMA } from '@/features/user/detail/ui/user-consent-agreement-section'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import type { AdminMemberConsentSummary } from '@/shared/api/generated/members/schemas/adminMemberConsentSummary'

const individualSchema = CONSENT_PRESET_SCHEMA.individual

describe('resolveTermsTypeToConsentLabel', () => {
  it('PRIVACY_COLLECTION·ADMINISTRATIVE_JOINT을 UI 라벨로 매핑한다', () => {
    expect(resolveTermsTypeToConsentLabel('PRIVACY_COLLECTION')).toBe(
      '개인정보 수집·이용 동의'
    )
    expect(resolveTermsTypeToConsentLabel('ADMINISTRATIVE_JOINT')).toBe(
      '행정정보 공동이용 동의서'
    )
  })

  it('등록 canonical termsType을 UI 라벨로 매핑한다', () => {
    expect(resolveTermsTypeToConsentLabel('PAYMENT_STATEMENT_PRE_CONSENT')).toBe(
      '지급조서 사전 동의서'
    )
    expect(resolveTermsTypeToConsentLabel('FACILITATOR_PLEDGE')).toBe('교육진행자 서약서')
    expect(resolveTermsTypeToConsentLabel('ADMINISTRATIVE_INFO_CONSENT')).toBe(
      '행정정보 공동이용 동의서'
    )
    expect(resolveTermsTypeToConsentLabel('CRIMINAL_HISTORY_CHECK_CONSENT')).toBe(
      '성범죄경력 조회 동의서'
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

  it('교사 preset(시안 4427:48695)은 교사 및 기관 정보 동의·동의서 4종을 포함한다', () => {
    const schoolTeacherSchema = CONSENT_PRESET_SCHEMA.school_teacher
    const rows = applyTermsAgreementsToSchema(schoolTeacherSchema, [
      { termsType: 'TEACHER_INFO_COLLECTION', agreed: true },
      { termsType: 'PAYMENT_STATEMENT', agreed: true },
      { termsType: 'EDUCATOR_PLEDGE', agreed: true },
    ])
    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('교사 및 기관 정보 동의')).toMatchObject({ agreed: true })
    expect(field('지급조서 사전 동의서')).toMatchObject({ type: 'document', agreed: true })
    expect(field('교육진행자 서약서')).toMatchObject({ type: 'document', agreed: true })
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
    expect(field('행정정보 공동이용 동의서')).toMatchObject({
      type: 'document',
      agreed: true,
    })
    expect(field('성범죄경력 조회 동의서')).toMatchObject({ type: 'document', agreed: true })
  })

  it('데이터가 없으면 mock 샘플 대신 미동의 기본값을 사용한다', () => {
    const rows = applyTermsAgreementsToSchema(individualSchema, [])

    const field = (label: string) =>
      rows.flatMap(r => r.fields).find(f => f.label === label)?.value

    expect(field('서비스 이용약관')).toMatchObject({ agreed: false })
    expect(field('개인정보 수집·이용 동의')).toMatchObject({ agreed: false })
  })
})

/** 관리자 /consents 응답 한 건 — 필수 필드 기본값 + 테스트별 덮어쓰기 */
function summary(
  overrides: Partial<AdminMemberConsentSummary> & Pick<AdminMemberConsentSummary, 'consentType'>
): AdminMemberConsentSummary {
  return {
    title: overrides.consentType,
    applicable: true,
    required: false,
    agreed: false,
    signed: false,
    status: 'NOT_AGREED',
    expired: false,
    withdrawable: false,
    participationRestricted: false,
    paymentRestricted: false,
    reconsentRequired: false,
    policyUpdated: false,
    withdrawBlocked: false,
    filledDocumentAvailable: false,
    signedDocumentAvailable: false,
    ...overrides,
  }
}

const fieldValue = (rows: ReturnType<typeof applyMemberConsentToSchema>, label: string) =>
  rows.flatMap(r => r.fields).find(f => f.label === label)?.value

describe('resolveConsentSummaryStatusState', () => {
  it('status만으로 동의·만료를 정한다', () => {
    for (const status of ['AGREED', 'SIGNED', 'CONSENTED']) {
      expect(resolveConsentSummaryStatusState(status)).toEqual({ agreed: true, expired: false })
    }
    expect(resolveConsentSummaryStatusState('EXPIRED')).toEqual({ agreed: false, expired: true })
    for (const status of [
      'NOT_APPLICABLE',
      'NOT_AGREED',
      'WITHDRAWN',
      'POLICY_UPDATED',
      'SIGNATURE_REQUIRED',
      'DRAFT',
      'VOID',
      undefined,
    ]) {
      expect(resolveConsentSummaryStatusState(status)).toEqual({ agreed: false, expired: false })
    }
  })
})

describe('applyMemberConsentToSchema', () => {
  it('상태는 Summary status로 정하고 agreed 값은 쓰지 않는다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({ consentType: 'MARKETING', status: 'AGREED', agreed: false }),
        summary({ consentType: 'SERVICE_TERMS', status: 'WITHDRAWN', agreed: true }),
      ],
    })
    expect(fieldValue(rows, '마케팅 제공 동의')).toMatchObject({ agreed: true })
    expect(fieldValue(rows, '서비스 이용약관')).toMatchObject({ agreed: false })
  })

  it('Summary consentStatus PARTIAL을 필드에 전달한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({ consentType: 'PRIVACY_COLLECTION', status: 'AGREED', consentStatus: 'PARTIAL' }),
        summary({ consentType: 'PORTRAIT_RIGHTS', status: 'SIGNED', consentStatus: 'PARTIAL' }),
      ],
    })

    expect(fieldValue(rows, '개인정보 수집·이용 동의')).toMatchObject({
      type: 'remote_consent',
      agreed: true,
      consentStatus: 'PARTIAL',
    })
    expect(fieldValue(rows, '초상권 수집·이용 동의')).toMatchObject({
      type: 'document',
      agreed: true,
      consentStatus: 'PARTIAL',
    })
  })

  describe('초상권 allItemsAgreed', () => {
    it('Summary allItemsAgreed true/false를 동의서 필드에 전달한다', () => {
      for (const allItemsAgreed of [true, false]) {
        const rows = applyMemberConsentToSchema(individualSchema, {
          consentSummaries: [
            summary({
              consentType: 'PORTRAIT_RIGHTS',
              status: 'SIGNED',
              consentStatus: 'PARTIAL',
              programEligible: true,
              allItemsAgreed,
            }),
          ],
        })
        expect(fieldValue(rows, '초상권 수집·이용 동의')).toMatchObject({
          type: 'document',
          consentStatus: 'PARTIAL',
          allItemsAgreed,
        })
      }
    })

    it('비초상권 Summary는 allItemsAgreed가 null이다', () => {
      const rows = applyMemberConsentToSchema(individualSchema, {
        consentSummaries: [
          summary({ consentType: 'MARKETING', status: 'AGREED', allItemsAgreed: null }),
        ],
      })
      expect(fieldValue(rows, '마케팅 제공 동의')).toMatchObject({
        type: 'remote_consent',
        allItemsAgreed: null,
      })
    })

    it('Summary가 있으면 consent-records 값으로 보강하지 않는다', () => {
      const rows = applyMemberConsentToSchema(individualSchema, {
        consentSummaries: [
          summary({ consentType: 'PORTRAIT_RIGHTS', status: 'SIGNED', consentStatus: 'PARTIAL' }),
        ],
        consentRecords: [
          {
            consentType: 'PORTRAIT_RIGHTS',
            consentRecordId: 9,
            allItemsAgreed: true,
            filledDocumentAvailable: true,
            filledDocumentRevealEndpoint: '/records-endpoint',
          },
        ],
      })
      const value = fieldValue(rows, '초상권 수집·이용 동의')
      expect(value).toMatchObject({ filledDocumentAvailable: false })
      expect(value).not.toMatchObject({ allItemsAgreed: true })
      expect(value).not.toMatchObject({ consentRecordId: 9 })
    })

    it('Summary status EXPIRED면 동의 만료와 만료일을 전달하고 동의 일시는 숨긴다', () => {
      const rows = applyMemberConsentToSchema(individualSchema, {
        consentSummaries: [
          summary({
            consentType: 'PORTRAIT_RIGHTS',
            status: 'EXPIRED',
            agreedAt: '2025-10-31T03:00:00Z',
            consentStatus: 'PARTIAL',
            allItemsAgreed: true,
            expired: true,
            expiresAt: '2026-10-31T03:00:00Z',
            filledDocumentUnavailableReason: 'CONSENT_EXPIRED',
          }),
        ],
      })
      const value = fieldValue(rows, '초상권 수집·이용 동의')
      expect(value).toMatchObject({
        type: 'document',
        agreed: false,
        expired: true,
        expiredAtDisplay: '2026.10.31',
        filledDocumentUnavailableReason: 'CONSENT_EXPIRED',
      })
      expect(value && 'agreedAtDisplay' in value ? value.agreedAtDisplay : undefined).toBeUndefined()
    })

    it('EXPIRED가 아니면 expired를 붙이지 않고, 동의서형이 아닌 항목은 만료를 표시하지 않는다', () => {
      const rows = applyMemberConsentToSchema(individualSchema, {
        consentSummaries: [
          summary({
            consentType: 'PORTRAIT_RIGHTS',
            status: 'SIGNED',
            consentStatus: 'PARTIAL',
            allItemsAgreed: true,
            expiresAt: '2027-10-31T03:00:00Z',
          }),
          summary({ consentType: 'SERVICE_TERMS', status: 'EXPIRED', expiresAt: '2026-10-31T03:00:00Z' }),
        ],
      })
      expect(fieldValue(rows, '초상권 수집·이용 동의')).not.toHaveProperty('expired')
      const serviceTerms = fieldValue(rows, '서비스 이용약관')
      expect(serviceTerms).toMatchObject({ type: 'remote_consent', agreed: false })
      expect(serviceTerms).not.toHaveProperty('expired')
    })

    it('termsAgreements 경로에서도 allItemsAgreed를 전달한다', () => {
      const rows = applyMemberConsentToSchema(individualSchema, {
        termsAgreements: [
          {
            termsType: 'PORTRAIT_RIGHTS',
            agreed: true,
            consentStatus: 'PARTIAL',
            allItemsAgreed: true,
          },
        ],
      })
      expect(fieldValue(rows, '초상권 수집·이용 동의')).toMatchObject({
        type: 'document',
        agreed: true,
        allItemsAgreed: true,
      })
    })
  })

  it('Summary의 대표 기록·작성본·서명본 열람 값을 그대로 동의서 필드에 싣는다 (190114 지급조서)', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({
          consentType: 'PAYMENT_STATEMENT_CONSENT',
          status: 'SIGNED',
          agreed: true,
          agreedAt: '2026-11-14T14:20:09Z',
          documentId: 1694927,
          currentConsentRecordId: 1696589,
          filledDocumentAvailable: true,
          filledDocumentRevealEndpoint:
            '/api/admin/users/190114/consent-records/PAYMENT_STATEMENT_CONSENT/filled-document?consentRecordId=1696589',
          signedDocumentAvailable: true,
          signedDocumentId: 1694927,
          signedDocumentRevealEndpoint:
            '/api/admin/users/190114/consent-records/PAYMENT_STATEMENT_CONSENT/signed-document?documentId=1694927',
        }),
      ],
      consentRecords: [
        {
          consentType: 'PAYMENT_STATEMENT_CONSENT',
          consentRecordId: 1696594,
          consentedAt: '2026-11-14T14:20:09Z',
          filledDocumentAvailable: true,
        },
      ],
    })

    expect(fieldValue(rows, '지급조서 사전 동의서')).toMatchObject({
      type: 'document',
      agreed: true,
      consentType: 'PAYMENT_STATEMENT_CONSENT',
      consentRecordId: 1696589,
      filledDocumentAvailable: true,
      filledDocumentRevealEndpoint:
        '/api/admin/users/190114/consent-records/PAYMENT_STATEMENT_CONSENT/filled-document?consentRecordId=1696589',
      signedDocumentAvailable: true,
      signedDocumentId: 1694927,
      signedDocumentRevealEndpoint:
        '/api/admin/users/190114/consent-records/PAYMENT_STATEMENT_CONSENT/signed-document?documentId=1694927',
    })
  })

  it('작성본 없이 서명본만 열 수 있는 값을 그대로 싣는다 (190114 범죄경력)', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({
          consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
          status: 'SIGNED',
          currentConsentRecordId: 1696591,
          filledDocumentAvailable: false,
          filledDocumentUnavailableReason: 'NOT_SUBMITTED',
          signedDocumentAvailable: true,
          signedDocumentId: 1694929,
          signedDocumentRevealEndpoint: '/signed?documentId=1694929',
        }),
      ],
    })
    expect(fieldValue(rows, '성범죄경력 조회 동의서')).toMatchObject({
      agreed: true,
      filledDocumentAvailable: false,
      filledDocumentUnavailableReason: 'NOT_SUBMITTED',
      signedDocumentAvailable: true,
      signedDocumentRevealEndpoint: '/signed?documentId=1694929',
    })
  })

  it('둘 다 열 수 없으면 조회 주소를 싣지 않는다 (190111 초상권)', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({
          consentType: 'PORTRAIT_RIGHTS',
          status: 'SIGNED',
          currentConsentRecordId: null,
          filledDocumentAvailable: false,
          filledDocumentRevealEndpoint: null,
          filledDocumentUnavailableReason: 'NOT_SUBMITTED',
          signedDocumentAvailable: false,
          signedDocumentId: null,
          signedDocumentRevealEndpoint: null,
        }),
      ],
    })
    const value = fieldValue(rows, '초상권 수집·이용 동의')
    expect(value).toMatchObject({
      agreed: true,
      filledDocumentAvailable: false,
      signedDocumentAvailable: false,
      filledDocumentUnavailableReason: 'NOT_SUBMITTED',
    })
    if (value?.type !== 'document') throw new Error('Expected document value')
    expect(value.consentRecordId).toBeUndefined()
    expect(value.filledDocumentRevealEndpoint).toBeUndefined()
    expect(value.signedDocumentRevealEndpoint).toBeUndefined()
  })

  it('termsAgreements 경로는 consentRecordId가 일치하는 기록 메타만 쓴다 (같은 유형 중 고르지 않음)', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      termsAgreements: [
        { termsType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: true, agreedAt: '2026-03-01T00:00:00Z' },
      ],
      consentRecords: [
        {
          consentType: 'ADMINISTRATIVE_INFO_CONSENT',
          consentRecordId: 70,
          consentValue: true,
          formResponseId: 88,
          filledDocumentAvailable: true,
        },
      ],
    })

    const notice = fieldValue(rows, '행정정보 공동이용 동의서')
    expect(notice).toMatchObject({
      type: 'document',
      agreed: true,
      consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    })
    expect(notice).not.toMatchObject({ formResponseId: 88 })
    expect(notice).not.toMatchObject({ filledDocumentAvailable: true })
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

    expect(fieldValue(rows, '초상권 수집·이용 동의')).toMatchObject({
      type: 'document',
      agreed: false,
    })
  })

  it('Summary termsType 별칭(TERMS)을 서비스 이용약관 라벨에 매핑한다', () => {
    const rows = applyMemberConsentToSchema(individualSchema, {
      consentSummaries: [
        summary({ consentType: 'TERMS', status: 'AGREED', agreedAt: '2026-01-15T09:15:42Z' }),
      ],
    })

    expect(fieldValue(rows, '서비스 이용약관')).toMatchObject({
      type: 'remote_consent',
      agreed: true,
    })
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

    expect(fieldValue(rows, '교육진행자 서약서')).toMatchObject({
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
        summary({
          consentType: 'PAYMENT_STATEMENT_CONSENT',
          status: 'SIGNED',
          agreedAt: '2026-01-01T00:00:00Z',
        }),
      ],
    })

    expect(fieldValue(rows, '지급조서 사전 동의서')).toMatchObject({ type: 'document', agreed: true })
  })
})
