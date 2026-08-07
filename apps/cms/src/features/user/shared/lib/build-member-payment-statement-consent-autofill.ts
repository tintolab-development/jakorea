import { PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export type MemberPaymentStatementAutofillSource = {
  name?: string
  birthDate?: string
  homeAddress?: string
  homeAddressDetail?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
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

function resolveAffiliation(source: MemberPaymentStatementAutofillSource): {
  affiliation: string
  noAffiliation: boolean
} {
  if (source.affiliationNone) {
    return { affiliation: '', noAffiliation: true }
  }

  if (source.memberType === 'school_teacher') {
    return {
      affiliation: source.schoolName?.trim() ?? '',
      noAffiliation: false,
    }
  }

  return {
    affiliation: source.affiliationName?.trim() ?? '',
    noAffiliation: false,
  }
}

/** 회원·강사 신규 등록 — 지급조서 사전 동의서 기본정보 prefill */
export function buildMemberPaymentStatementBasicInfoAutofill(
  source: MemberPaymentStatementAutofillSource
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const nameKo = source.name?.trim() ?? ''
  const accountHolder = source.accountHolder?.trim() || nameKo
  const { affiliation, noAffiliation } = resolveAffiliation(source)

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
    ...(source.bankName?.trim() ? { bankName: source.bankName.trim() } : {}),
    ...(source.accountNumber?.trim() ? { accountNumber: source.accountNumber.trim() } : {}),
    ...(accountHolder ? { accountHolder } : {}),
    ...(affiliation ? { affiliation } : {}),
    ...(noAffiliation ? { noAffiliation: true } : {}),
  }
}
