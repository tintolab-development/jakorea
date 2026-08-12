import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

/** 지급조서 사전 동의서 — 기본정보 블록 필수값 누락 여부 */
export function isPaymentStatementBasicInfoIncomplete(
  values: Partial<PaymentStatementBasicInfoAutofillValues> | undefined
): boolean {
  if (values == null) return true

  if (!values.nameKo?.trim()) return true
  if (!values.residentFront?.trim()) return true
  if (!values.residentBack?.trim()) return true
  if (
    isRequiredAddressIncomplete({
      address: values.addressRoad,
      addressDetail: values.addressDetail,
      subject: 'person',
    })
  ) {
    return true
  }
  if (!values.bankName?.trim()) return true
  if (!values.accountNumber?.trim()) return true
  if (!values.accountHolder?.trim()) return true

  if (values.noAffiliation) return false
  return !values.affiliation?.trim()
}
