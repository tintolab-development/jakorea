import { mapAccountPaymentDetailFromGetApi } from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import { mapAccountPaymentListToRows } from '@/features/settlement-management/api/account-payments/map-account-payment-rows'
import type { AccountPaymentsListFilterInput } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import { buildAccountPaymentsListParams } from '@/features/settlement-management/api/account-payments/build-account-payments-list-params'
import {
  fetchAccountPaymentDetailRemote,
  fetchAllAccountPaymentsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/features/settlement-management/model/account-payments-list'

/**
 * 계좌 지급 상세 원문은 GET /api/admin/account-payments/{id}만 사용한다.
 * BE가 성공 시 개인정보 조회 이력을 자동 기록한다. FE는 reason을 보내지 않고 이력을 중복 INSERT하지 않는다.
 * 정책 문구 `정산금의 계좌 지급 처리를 위함`과 OpenAPI 주석 `정산금 지급 처리를 위함`이 다르면 BE 정본을 덮어쓰지 않는다.
 * 성별·생년월일·연락처·이메일·주소는 이 응답에 없으면 `-`다. 강사 unmask와 회원 GET으로 채우지 않는다.
 * 계좌 원문은 sensitiveAccount만 쓴다. 감사 INSERT는 하지 않는다.
 */

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
  return mapAccountPaymentDetailFromGetApi(row, detail)
}
