/**
 * 지급 현황 강사 상세 — instructor privacy/unmask 응답을 상세 표시 모델에 반영
 */

import type { PaymentOrderAdminInstructorDetail } from '@/features/settlement-management/model/payment-order-admin-list'
import type { HomeAddress } from '@/shared/api/generated/members/schemas/homeAddress'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'

function formatInstructorHomeAddress(homeAddress: HomeAddress | null | undefined): string {
  if (!homeAddress) return ''
  const line = homeAddress.line?.trim() ?? ''
  const detail = homeAddress.detail?.trim() ?? ''
  return [line, detail].filter(Boolean).join(' ')
}

export function mergeInstructorDetailFromPrivacyUnmask(
  detail: PaymentOrderAdminInstructorDetail,
  unmask: InstructorMemberDetailResponse | null | undefined
): PaymentOrderAdminInstructorDetail {
  if (!unmask) return detail
  const member = unmask.member
  const settlement = unmask.settlement
  const address = formatInstructorHomeAddress(unmask.profile?.homeAddress)
  return {
    ...detail,
    nameKo: member?.name?.trim() || detail.nameKo,
    phone: member?.phone?.trim() || detail.phone,
    email: member?.email?.trim() || detail.email,
    address: address || detail.address,
    bankName: settlement?.bankName?.trim() || detail.bankName,
    accountNumber: settlement?.accountNumber?.trim() || detail.accountNumber,
    accountHolder: settlement?.accountHolder?.trim() || detail.accountHolder,
    scheduleChangeCancelCount:
      member?.scheduleChangeCancelCount ?? detail.scheduleChangeCancelCount,
  }
}
