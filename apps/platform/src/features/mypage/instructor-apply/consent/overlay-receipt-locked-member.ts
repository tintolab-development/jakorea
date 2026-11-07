import {
  mergeReceiptPreConsentBasicInfo,
  type PaymentStatementBasicInfoValues,
  type ReceiptPreConsentBasicInfoValues,
} from '@jakorea/form-schema/consent'

export type ReceiptLockedMemberFields = {
  nameKo: string
  addressRoad: string
  addressDetail: string
  lockAddress: boolean
}

/** 영수증 지급 확인 정보 — 회원 성명 고정, 개인 회원은 자택 주소도 고정 */
export function overlayReceiptLockedMemberValues(
  values: Partial<PaymentStatementBasicInfoValues> | undefined,
  locked: ReceiptLockedMemberFields | null | undefined,
): ReceiptPreConsentBasicInfoValues {
  const merged = mergeReceiptPreConsentBasicInfo(values)
  if (locked == null) return merged
  return mergeReceiptPreConsentBasicInfo({
    ...merged,
    nameKo: locked.nameKo.trim() || merged.nameKo,
    ...(locked.lockAddress
      ? {
          addressRoad: locked.addressRoad,
          addressDetail: locked.addressDetail,
        }
      : {}),
  })
}
