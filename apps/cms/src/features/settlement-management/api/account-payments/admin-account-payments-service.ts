import {
  mapAccountPaymentDetailFromGetApi,
  resolveAccountPaymentMemberId,
} from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import type { AccountPaymentsListFilterInput } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import { buildAccountPaymentsListParams } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import {
  fetchAccountPaymentDetailRemote,
  fetchAllAccountPaymentsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { unmaskInstructorMemberPrivacyRemote } from '@/features/user/api/members-api-client'
import { queryClient } from '@/shared/lib/query-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/features/settlement-management/model/account-payments-list'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'

/**
 * 계좌 지급 확인 현황 상세는 마스킹 UI가 없다.
 * 진입 시 강사 PII 원문 조회 + 개인정보조회 이력을 이 고정 목적으로 남긴다.
 */
export const ACCOUNT_PAYMENT_DETAIL_PRIVACY_ACCESS_PURPOSE = '정산금 지급 처리를 위함'

export async function getAccountPaymentsListRemote(
  filters: AccountPaymentsListFilterInput = {}
): Promise<AccountPaymentRow[]> {
  const payments = await fetchAllAccountPaymentsRemote(buildAccountPaymentsListParams(filters))
  return mapAccountPaymentListToRows(payments ?? [])
}

export async function getAccountPaymentDetailRemote(
  row: AccountPaymentRow
): Promise<AccountPaymentStatusDetail> {
  const paymentId = row.accountPaymentId
  if (paymentId == null) {
    throw new Error('계좌 지급 상세에 필요한 accountPaymentId가 없습니다.')
  }

  const detail = await fetchAccountPaymentDetailRemote(paymentId)
  const memberId = resolveAccountPaymentMemberId(detail, row)

  let instructorDetail: InstructorMemberDetailResponse | null = null
  if (memberId != null) {
    try {
      // 마스킹 GET이 아니라 unmask — 성별·연락처·이메일·자택 원문 + 감사 로그
      instructorDetail = await unmaskInstructorMemberPrivacyRemote(memberId, {
        reason: ACCOUNT_PAYMENT_DETAIL_PRIVACY_ACCESS_PURPOSE,
      })
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
    } catch {
      // 2차 unmask 실패 시 PII만 `-` — 계좌·산출(settlement)은 유지
      instructorDetail = null
    }
  }

  return mapAccountPaymentDetailFromGetApi(row, detail, instructorDetail)
}
