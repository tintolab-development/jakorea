import type { ContainedPiiType } from './file-download-password.js'

export type ProtectedFileDownloadKind =
  | 'PAYMENT_STATEMENT'
  | 'BULK_TRANSFER_EXCEL'
  | 'TAX_REPORT_EXCEL'
  | 'SEX_OFFENSE_CONSENT'
  | 'ADMINISTRATIVE_INFO_CONSENT'
  | 'HOMEPAGE_PII_ATTACHMENT'

const RRN_AND_ACCOUNT: readonly ContainedPiiType[] = [
  'RESIDENT_REGISTRATION_NUMBER',
  'ACCOUNT_NUMBER',
]

const RRN_ONLY: readonly ContainedPiiType[] = ['RESIDENT_REGISTRATION_NUMBER']

const KIND_DEFAULT_PII: Record<ProtectedFileDownloadKind, readonly ContainedPiiType[]> = {
  PAYMENT_STATEMENT: RRN_AND_ACCOUNT,
  BULK_TRANSFER_EXCEL: RRN_AND_ACCOUNT,
  TAX_REPORT_EXCEL: RRN_AND_ACCOUNT,
  SEX_OFFENSE_CONSENT: RRN_ONLY,
  ADMINISTRATIVE_INFO_CONSENT: RRN_ONLY,
  /** 이력서·신청 첨부. 주민번호·계좌가 확정되지 않으면 일반 개인정보 문구 */
  HOMEPAGE_PII_ATTACHMENT: [],
}

export function defaultContainedPiiForKind(
  kind: ProtectedFileDownloadKind
): readonly ContainedPiiType[] {
  return KIND_DEFAULT_PII[kind]
}

export function resolveContainedPiiTypes(
  kind: ProtectedFileDownloadKind,
  override?: readonly ContainedPiiType[] | null
): readonly ContainedPiiType[] {
  if (override != null && override.length > 0) return override
  return defaultContainedPiiForKind(kind)
}
