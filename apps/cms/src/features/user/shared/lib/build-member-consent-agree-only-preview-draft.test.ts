import { describe, expect, it } from 'vitest'
import { AGREEMENT_PORTRAIT_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
import {
  buildMemberConsentAgreeOnlyPreviewDraft,
  shouldFetchSubmittedConsentDocument,
} from './build-member-consent-agree-only-preview-draft'
import type { User } from '@/types/user'

function baseUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    memberId: 1,
    loginId: 'hong',
    name: '홍길동',
    email: 'hong@example.com',
    role: 'INDIVIDUAL',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    phone: '01012345678',
    birthDate: '19900115',
    affiliation: 'JA Korea',
    schoolEnrollmentStatus: 'NOT_ENROLLED',
    detailAddress: '서울특별시 강서구 화곡동',
    ...overrides,
  } as User
}

describe('shouldFetchSubmittedConsentDocument', () => {
  it('true만 제출본 경로', () => {
    expect(shouldFetchSubmittedConsentDocument(true)).toBe(true)
    expect(shouldFetchSubmittedConsentDocument(false)).toBe(false)
    expect(shouldFetchSubmittedConsentDocument(undefined)).toBe(false)
  })
})

describe('buildMemberConsentAgreeOnlyPreviewDraft', () => {
  it('초상권 — 성명 주입 + 표 하단 동의', () => {
    const result = buildMemberConsentAgreeOnlyPreviewDraft('agreement-portrait', baseUser())
    expect(result).not.toBeNull()
    const table = result!.draft.paragraphs.find(
      p => p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable
    )
    expect(
      table?.kind === 'single_item' && table.variant === 'vertical_table' && table.rows[0]?.cells[0]
    ).toBe('홍길동')
    expect(
      table != null && 'bottomConsent' in table ? table.bottomConsent : undefined
    ).toBe('agree')
  })

  it('행정정보 — 성명·생년월일·전화 주입', () => {
    const result = buildMemberConsentAgreeOnlyPreviewDraft('agreement-notice', baseUser())
    expect(result).not.toBeNull()
    const subject = result!.draft.paragraphs.find(p => p.id === 'agreement-notice-subject')
    expect(subject?.kind === 'single_item' && subject.variant === 'short_essay').toBe(true)
    if (subject?.kind !== 'single_item' || subject.variant !== 'short_essay') return
    const byId = Object.fromEntries((subject.items ?? []).map(i => [i.id, i.bodyText]))
    expect(byId['agreement-notice-subj-name']).toBe('홍길동')
    expect(byId['agreement-notice-subj-birth']).toBe('19900115')
    expect(byId['agreement-notice-subj-phone']).toBe('01012345678')
  })

  it('지급조서 — paymentBasicInfo autofill', () => {
    const result = buildMemberConsentAgreeOnlyPreviewDraft('agreement-third-party', baseUser())
    expect(result?.paymentBasicInfo?.nameKo).toBe('홍길동')
    expect(result?.paymentBasicInfo?.addressRoad).toBe('서울특별시 강서구 화곡동')
    expect(result?.participantName).toBe('홍길동')
  })

  it('교육진행자 — 동의 선택 + participantName', () => {
    const result = buildMemberConsentAgreeOnlyPreviewDraft('agreement-expense', baseUser())
    expect(result?.participantName).toBe('홍길동')
    const mc = result!.draft.paragraphs.find(
      p => p.kind === 'single_item' && p.variant === 'multiple_choice'
    )
    expect(mc && 'selectedPreviewSingleId' in mc && mc.selectedPreviewSingleId).toBeTruthy()
  })

  it('성범죄 템플릿은 null (이미지 뷰 전용)', () => {
    expect(buildMemberConsentAgreeOnlyPreviewDraft('agreement-crime', baseUser())).toBeNull()
  })
})
