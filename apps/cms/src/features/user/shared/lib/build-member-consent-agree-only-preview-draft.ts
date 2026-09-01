import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import {
  ensureAgreementNoticeConfirmationClosing,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import {
  applyEducatorFacilitatorPledgeDefaultAgree,
  applyMemberNoticeConsentPrefill,
  applyMemberPortraitConsentPrefill,
  buildMemberConsentContextFromUser,
} from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import {
  buildMemberPaymentStatementBasicInfoAutofill,
  type MemberPaymentStatementAutofillSource,
} from '@/features/user/shared/lib/build-member-payment-statement-consent-autofill'
import type { DateValue } from '@/types'
import type { User } from '@/types/user'

const PAYMENT_STATEMENT_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'document-payment-order-pre-consent',
])

export type MemberConsentAgreeOnlyPreviewResult = {
  draft: WritingFormDraft
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoAutofillValues>
  participantName?: string
}

/** 제출본이 있을 때만 filled-document API·열람 사유 경로를 탄다. */
export function shouldFetchSubmittedConsentDocument(
  filledDocumentAvailable: boolean | undefined
): boolean {
  return filledDocumentAvailable === true
}

export function isMemberConsentCrimeTemplateId(templateId: string): boolean {
  return templateId.trim() === AGREEMENT_CRIME_TEMPLATE_CODE
}

function resolveSeedDraft(templateId: string): WritingFormDraft | null {
  const config = resolveAgreementWritingFormConfig(templateId)
  if (config == null) return null
  const initialDraft = config.initialDraft
  return typeof initialDraft === 'function' ? initialDraft() : initialDraft
}

function dateValueToBirthDigits(value: DateValue | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '')
    return digits.length >= 8 ? digits.slice(0, 8) : digits || undefined
  }
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function buildMemberPaymentAutofillSourceFromUser(
  user: Pick<
    User,
    | 'name'
    | 'birthDate'
    | 'detailAddress'
    | 'detailAddressDetail'
    | 'affiliation'
    | 'schoolEnrollmentStatus'
    | 'instructorMemberProfile'
    | 'instructorInfo'
    | 'instructorCmsSettlement'
    | 'affiliatedSchoolName'
    | 'role'
  >
): MemberPaymentStatementAutofillSource {
  const settlement = user.instructorCmsSettlement
  const info = user.instructorInfo
  const isSchoolTeacher =
    user.instructorMemberProfile === 'school_teacher' ||
    (user.role === 'INSTRUCTOR' && user.schoolEnrollmentStatus === 'ENROLLED')

  return {
    name: user.name,
    birthDate: dateValueToBirthDigits(user.birthDate),
    homeAddress: user.detailAddress,
    homeAddressDetail: user.detailAddressDetail,
    bankName: settlement?.bankName ?? info?.bankName,
    accountNumber: settlement?.accountNumber ?? info?.accountNumber,
    accountHolder: settlement?.accountHolder ?? info?.accountHolder,
    memberType: isSchoolTeacher ? 'school_teacher' : 'general',
    schoolName: user.affiliatedSchoolName ?? user.affiliation,
    affiliationName: user.affiliation,
  }
}

/**
 * 플랫폼 가입 시 동의만 체크(제출본 없음)한 회원 — 동의서 보기용 합성 draft.
 * 작성(write) 모달에서는 사용하지 않는다.
 */
export function buildMemberConsentAgreeOnlyPreviewDraft(
  templateId: string,
  user: Parameters<typeof buildMemberPaymentAutofillSourceFromUser>[0] & Pick<User, 'phone'>,
  structureDraft?: WritingFormDraft | null
): MemberConsentAgreeOnlyPreviewResult | null {
  const code = templateId.trim()
  if (!code || isMemberConsentCrimeTemplateId(code)) return null

  const seed = resolveSeedDraft(code)
  const structureSource = structureDraft ?? seed
  if (structureSource == null) return null

  let draft = normalizeWritingFormDraft(structureSource)
  if (code === 'agreement-notice') {
    draft = ensureAgreementNoticeConfirmationClosing(draft)
    draft = overlayAgreementNoticeSeedHorizontalTable(draft)
  }

  draft = applyEducatorFacilitatorPledgeDefaultAgree(draft)

  const ctx = buildMemberConsentContextFromUser({
    ...user,
    birthDate: dateValueToBirthDigits(user.birthDate),
    phone: user.phone,
  })

  if (code === 'agreement-portrait') {
    draft = applyMemberPortraitConsentPrefill(draft, ctx)
  }
  if (code === 'agreement-notice') {
    draft = applyMemberNoticeConsentPrefill(draft, ctx)
  }

  const participantName = ctx.name.trim() || undefined
  const paymentBasicInfo = PAYMENT_STATEMENT_TEMPLATE_IDS.has(code)
    ? buildMemberPaymentStatementBasicInfoAutofill(buildMemberPaymentAutofillSourceFromUser(user))
    : undefined

  return {
    draft,
    ...(paymentBasicInfo != null ? { paymentBasicInfo } : {}),
    ...(participantName != null ? { participantName } : {}),
  }
}
