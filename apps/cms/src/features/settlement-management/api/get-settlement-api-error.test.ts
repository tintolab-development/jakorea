import { describe, expect, it } from 'vitest'
import {
  getSettlementApiErrorMessage,
  isPaymentStatementStatusConflictError,
} from './get-settlement-api-error'

describe('getSettlementApiErrorMessage', () => {
  it('409 PAYMENT_STATEMENT_STATUS_CONFLICT → message 우선', () => {
    const error = {
      response: {
        status: 409,
        data: {
          message: '지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.',
          error: {
            code: 'PAYMENT_STATEMENT_STATUS_CONFLICT',
            details: { statementStatus: 'REQUESTED' },
          },
        },
      },
    }

    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.'
    )
    expect(isPaymentStatementStatusConflictError(error)).toBe(true)
  })

  it('code만 있어도 conflict로 인식하고 fallback message', () => {
    const error = {
      response: {
        status: 409,
        data: {
          error: { code: 'PAYMENT_STATEMENT_STATUS_CONFLICT' },
        },
      },
    }

    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.'
    )
  })
})
