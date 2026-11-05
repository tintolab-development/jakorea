import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import type { SettlementDocumentKind } from './settlement-status-ui.ts'
import type { SettlementWriteDraft } from '../model/write-draft.ts'

export type SettlementBasicInfo = SettlementWriteDraft['basic']

function trimmed(value: string | undefined | null): string {
  return value?.trim() ?? ''
}

/** 마이페이지에 노출되는 회원 기본정보 — 정산 작성 기본정보 중 회원정보 소스 */
export type SettlementMemberProfileBasic = {
  name: string
  homeAddress: string
  homeAddressDetail: string
  bank: string
  accountNumber: string
  accountHolder: string
}

export function readSettlementMemberProfileBasic(
  profile: PortalProfileResponse | null | undefined,
): SettlementMemberProfileBasic {
  const cmsHome = profile?.instructorProfile?.profile?.homeAddress
  const settlement = profile?.instructorProfile?.settlement
  const account =
    settlement?.bankAccounts?.find(item => item.current) ?? settlement?.bankAccounts?.[0]
  const cmsLine = trimmed(cmsHome?.line)
  const cmsDetail = trimmed(cmsHome?.detail)
  return {
    name: trimmed(profile?.name),
    homeAddress: cmsLine || trimmed(profile?.address),
    homeAddressDetail: cmsDetail || trimmed(profile?.addressDetail),
    bank: trimmed(settlement?.bankName) || trimmed(account?.bankName),
    accountNumber: trimmed(settlement?.accountNumber) || trimmed(account?.accountNumber),
    accountHolder: trimmed(settlement?.accountHolder) || trimmed(account?.accountHolder),
  }
}

export function composeSettlementWriteBasic(options: {
  kind: SettlementDocumentKind
  member: SettlementMemberProfileBasic
  consent: Partial<PaymentStatementBasicInfoValues> | undefined
}): SettlementBasicInfo {
  const consent = options.consent ?? {}
  const member = options.member
  if (options.kind === 'receipt') {
    return {
      name: member.name,
      nameEn: trimmed(consent.nameEn),
      residentFront: '',
      residentBack: '',
      homeAddress: member.homeAddress,
      homeAddressDetail: member.homeAddressDetail,
      bank: trimmed(consent.bankName),
      accountNumber: trimmed(consent.accountNumber),
      accountHolder: trimmed(consent.accountHolder),
    }
  }
  return {
    name: member.name,
    nameEn: trimmed(consent.nameEn),
    residentFront: trimmed(consent.residentFront),
    residentBack: trimmed(consent.residentBack),
    homeAddress: member.homeAddress,
    homeAddressDetail: member.homeAddressDetail,
    bank: trimmed(consent.bankName),
    accountNumber: trimmed(consent.accountNumber),
    accountHolder: trimmed(consent.accountHolder),
  }
}
