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
  paymentPurpose: '',
}
