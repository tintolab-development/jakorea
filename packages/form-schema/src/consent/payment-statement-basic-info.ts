/** 지급조서 사전 동의서 — 기본정보 sidecar (schema `paymentRecord` 단락과 함께 사용) */
export const PAYMENT_STATEMENT_DEFAULT_PURPOSE = '강사비 또는 활동비 지급'

export type PaymentStatementBasicInfoValues = {
  nameKo: string
  nameEn: string
  residentFront: string
  residentBack: string
  affiliation: string
  noAffiliation: boolean
  addressRoad: string
  addressDetail: string
  bankName: string
  accountNumber: string
  accountHolder: string
  paymentPurpose: string
}

export const EMPTY_PAYMENT_STATEMENT_BASIC_INFO: PaymentStatementBasicInfoValues = {
  nameKo: '',
  nameEn: '',
  residentFront: '',
  residentBack: '',
  affiliation: '',
  noAffiliation: false,
  addressRoad: '',
  addressDetail: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  paymentPurpose: PAYMENT_STATEMENT_DEFAULT_PURPOSE,
}

/** 잠금 필드 「지급 목적」이 비어 있으면 고정 문구를 넣는다. */
export function ensurePaymentStatementDefaultPurpose<T extends { paymentPurpose?: string | null }>(
  values: T
): T & { paymentPurpose: string } {
  const purpose = values.paymentPurpose?.trim()
  return {
    ...values,
    paymentPurpose: purpose || PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  }
}

export function mergePaymentStatementBasicInfo(
  values?: Partial<PaymentStatementBasicInfoValues> | null
): PaymentStatementBasicInfoValues {
  return ensurePaymentStatementDefaultPurpose({
    ...EMPTY_PAYMENT_STATEMENT_BASIC_INFO,
    ...values,
  })
}
