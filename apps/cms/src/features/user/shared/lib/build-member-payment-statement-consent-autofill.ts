import {
  buildPaymentStatementProfileLinkedValues,
  overlayPaymentStatementProfileLinkedValues,
  type PaymentStatementProfileLinkedValues,
} from '@jakorea/form-schema/consent'
import { PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export type { PaymentStatementProfileLinkedValues }

export type MemberPaymentStatementAutofillSource = {
  name?: string
  birthDate?: string
  homeAddress?: string
  homeAddressDetail?: string
  memberType?: 'general' | 'school_teacher'
  affiliationNone?: boolean
  schoolName?: string
  affiliationName?: string
}

function birthDateToResidentFront(birthDate: string | undefined): string {
  const digits = birthDate?.replace(/\D/g, '') ?? ''
  if (digits.length === 8) return digits.slice(2)
  if (digits.length === 6) return digits
  return ''
}

/** 회원·강사 신규 등록 — 지급조서 사전 동의서 기본정보 prefill */
export function buildMemberPaymentStatementBasicInfoAutofill(
  source: MemberPaymentStatementAutofillSource
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const nameKo = source.name?.trim() ?? ''
  const profile = buildInstructorRegisterPaymentStatementProfileValues(source)

  return {
    ...PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES,
    ...(nameKo ? { nameKo } : {}),
    ...(birthDateToResidentFront(source.birthDate)
      ? { residentFront: birthDateToResidentFront(source.birthDate) }
      : {}),
    ...(source.homeAddress?.trim() ? { addressRoad: source.homeAddress.trim() } : {}),
    ...(source.homeAddressDetail?.trim()
      ? { addressDetail: source.homeAddressDetail.trim() }
      : {}),
    ...(nameKo ? { accountHolder: nameKo } : {}),
    ...(profile.affiliation ? { affiliation: profile.affiliation } : {}),
    ...(profile.noAffiliation ? { noAffiliation: true } : {}),
  }
}

/** CMS 강사 신규 등록 — 성명·소속·자택 주소를 등록 기본정보에서 복사 */
export function buildInstructorRegisterPaymentStatementProfileValues(
  source: MemberPaymentStatementAutofillSource
): PaymentStatementProfileLinkedValues {
  return buildPaymentStatementProfileLinkedValues(source)
}

export { overlayPaymentStatementProfileLinkedValues }
