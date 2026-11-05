import type { PaymentStatementBasicInfoValues } from './payment-statement-basic-info.js'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

/**
 * 영수증 발급 사전 동의서 지급 확인 정보.
 * 지급조서 `PAYMENT_STATEMENT_DEFAULT_PURPOSE`(강사비)와 분리한다.
 *
 * 문구는 Figma(2325:15207)의 「강사비 또는 활동비 지급」을 업무 정책에 맞게 치환한 초안이다.
 * 법적 확정 전 카피 변경이 필요할 수 있다.
 */
export const RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE = '실비 또는 활동비 지급'

export type ReceiptPreConsentBasicInfoValues = Omit<
  PaymentStatementBasicInfoValues,
  'residentFront' | 'residentBack' | 'affiliation' | 'noAffiliation'
>

export const EMPTY_RECEIPT_PRE_CONSENT_BASIC_INFO: ReceiptPreConsentBasicInfoValues = {
  nameKo: '',
  nameEn: '',
  addressRoad: '',
  addressDetail: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  paymentPurpose: RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
}

export function mergeReceiptPreConsentBasicInfo(
  values?: Partial<ReceiptPreConsentBasicInfoValues> | Partial<PaymentStatementBasicInfoValues> | null
): ReceiptPreConsentBasicInfoValues {
  const purpose = values?.paymentPurpose?.trim()
  return {
    nameKo: values?.nameKo ?? '',
    nameEn: values?.nameEn ?? '',
    addressRoad: values?.addressRoad ?? '',
    addressDetail: values?.addressDetail ?? '',
    bankName: values?.bankName ?? '',
    accountNumber: values?.accountNumber ?? '',
    accountHolder: values?.accountHolder ?? '',
    paymentPurpose: purpose && purpose.length > 0 ? purpose : RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
  }
}

/** 제출 payload — 주민등록번호·소속 키를 넣지 않는다. */
export function toReceiptPreConsentFilledBasicInfo(
  values?: Partial<ReceiptPreConsentBasicInfoValues> | Partial<PaymentStatementBasicInfoValues> | null
): Record<string, string> {
  const merged = mergeReceiptPreConsentBasicInfo(values)
  return {
    nameKo: merged.nameKo,
    nameEn: merged.nameEn,
    addressRoad: merged.addressRoad,
    addressDetail: merged.addressDetail,
    bankName: merged.bankName,
    accountNumber: merged.accountNumber,
    accountHolder: merged.accountHolder,
    paymentPurpose: merged.paymentPurpose,
  }
}

export function isReceiptPreConsentBasicInfoIncomplete(
  values: Partial<ReceiptPreConsentBasicInfoValues> | Partial<PaymentStatementBasicInfoValues> | undefined
): boolean {
  if (values == null) return true
  const merged = mergeReceiptPreConsentBasicInfo(values)
  if (!merged.nameKo.trim()) return true
  if (
    isRequiredAddressIncomplete({
      address: merged.addressRoad,
      addressDetail: merged.addressDetail,
      subject: 'person',
    })
  ) {
    return true
  }
  if (!merged.bankName.trim()) return true
  if (!merged.accountNumber.trim()) return true
  if (!merged.accountHolder.trim()) return true
  return false
}

export function receiptPreConsentBasicInfoHasResidentNumberFields(
  values: Record<string, unknown> | null | undefined
): boolean {
  if (values == null) return false
  const front = typeof values.residentFront === 'string' ? values.residentFront.trim() : ''
  const back = typeof values.residentBack === 'string' ? values.residentBack.trim() : ''
  return front !== '' || back !== ''
}
