import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON,
  fetchAccountPaymentDetailRemote,
} from '../settlement-api-client'

const { getAccountPayment } = vi.hoisted(() => ({ getAccountPayment: vi.fn() }))

vi.mock('@/shared/api/generated/settlement/settlement-api', () => ({
  getJAKoreaCMSBackendAPISettlementSubset: () => ({
    getAccountPayment,
  }),
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: <T>(body: { data?: T } | T) =>
    body && typeof body === 'object' && 'data' in body ? (body as { data: T }).data : body,
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: vi.fn(),
}))

describe('fetchAccountPaymentDetailRemote reason', () => {
  beforeEach(() => {
    getAccountPayment.mockReset()
    getAccountPayment.mockResolvedValue({
      data: { payment: { accountPaymentId: 188701 } },
    })
  })

  // vi.mock는 호이스팅되므로 정적 import로도 목이 적용된다. resetModules + 동적 import는
  // settlement-api-client 의존 그래프를 테스트 안에서 다시 변환해 5초 제한을 넘겼다.
  it('상세 GET에 감사 reason 쿼리를 실어 보낸다', async () => {
    await fetchAccountPaymentDetailRemote(188701)

    expect(getAccountPayment).toHaveBeenCalledWith(188701, {
      reason: ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON,
    })
    expect(ACCOUNT_PAYMENT_DETAIL_AUDIT_REASON).toBe('정산금의 계좌 지급 처리를 위함')
  })
})
