import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import type { SettlementWriteDraft } from '../model/write-draft.ts'

export type SettlementBasicInfo = SettlementWriteDraft['basic']

function trimmed(value: string | undefined): string {
  return value?.trim() ?? ''
}

/** 지급조서 사전 동의서 sidecar → 영수증 기본 정보. 비어 있는 키는 생략한다. */
export function mapPaymentStatementBasicInfoToSettlementBasic(
  info: Partial<PaymentStatementBasicInfoValues> | undefined,
): Partial<SettlementBasicInfo> {
  if (!info) return {}
  const name = trimmed(info.nameKo)
  const accountHolder = trimmed(info.accountHolder) || name
  const next: Partial<SettlementBasicInfo> = {}
  if (name) next.name = name
  if (trimmed(info.residentFront)) next.residentFront = trimmed(info.residentFront)
  if (trimmed(info.residentBack)) next.residentBack = trimmed(info.residentBack)
  if (trimmed(info.addressRoad)) next.homeAddress = trimmed(info.addressRoad)
  if (trimmed(info.addressDetail)) next.homeAddressDetail = trimmed(info.addressDetail)
  if (trimmed(info.bankName)) next.bank = trimmed(info.bankName)
  if (trimmed(info.accountNumber)) next.accountNumber = trimmed(info.accountNumber)
  if (accountHolder) next.accountHolder = accountHolder
  return next
}

/** 이미 있는 작성값은 유지하고, 빈 칸만 동의서 값으로 채운다. */
export function overlaySettlementBasicWithPaymentConsent(
  basic: SettlementBasicInfo,
  consent: Partial<SettlementBasicInfo> | undefined,
): SettlementBasicInfo {
  if (!consent) return basic
  return {
    name: trimmed(basic.name) || consent.name || '',
    residentFront: trimmed(basic.residentFront) || consent.residentFront || '',
    residentBack: trimmed(basic.residentBack) || consent.residentBack || '',
    homeAddress: trimmed(basic.homeAddress) || consent.homeAddress || '',
    homeAddressDetail: trimmed(basic.homeAddressDetail) || consent.homeAddressDetail || '',
    bank: trimmed(basic.bank) || consent.bank || '',
    accountNumber: trimmed(basic.accountNumber) || consent.accountNumber || '',
    accountHolder: trimmed(basic.accountHolder) || consent.accountHolder || consent.name || '',
  }
}
