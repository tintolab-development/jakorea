import { describe, expect, it } from 'vitest'
import {
  getSettlementConfigErrorField,
  getSettlementApiErrorMessage,
  isSettlementExportAlreadyDownloadedError,
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
      '이미 확인된 지급조서가 포함되어 있습니다. 목록을 새로고침한 뒤 다시 확인해 주세요.'
    )
  })

  it('400 SCHEDULED_PAYMENT_DATE_REQUIRED → FE fallback', () => {
    const error = {
      response: {
        status: 400,
        data: {
          error: { code: 'SCHEDULED_PAYMENT_DATE_REQUIRED', field: 'scheduledPaymentDate' },
        },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toContain('지급 예정일')
  })

  it('404 PAYMENT_STATEMENT_NOT_FOUND → FE fallback', () => {
    const error = {
      response: {
        status: 404,
        data: {
          error: { code: 'PAYMENT_STATEMENT_NOT_FOUND', details: { statementId: 169754 } },
        },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toContain('찾을 수 없습니다')
  })

  it('400 PAYMENT_STATEMENT_IDS_REQUIRED → FE fallback', () => {
    const error = {
      response: {
        status: 400,
        data: { error: { code: 'PAYMENT_STATEMENT_IDS_REQUIRED', field: 'statementIds' } },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toContain('선택')
  })

  it('정산 파일 중복 다운로드는 신규 발급 안내로 매핑한다', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED' } },
      },
    }
    expect(isSettlementExportAlreadyDownloadedError(error)).toBe(true)
    expect(getSettlementApiErrorMessage(error, 'fallback')).toContain('새 파일을 발급')
  })

  it('원천징수 설정 오류를 입력 영역으로 분류한다', () => {
    const rateError = {
      response: {
        status: 400,
        data: { error: { code: 'SETTLEMENT_CONFIG_WITHHOLDING_RATE_INVALID' } },
      },
    }
    const amountError = {
      response: {
        status: 400,
        data: { error: { code: 'SETTLEMENT_CONFIG_WITHHOLDING_AMOUNT_INVALID' } },
      },
    }
    expect(getSettlementConfigErrorField(rateError)).toBe('withholdingRate')
    expect(getSettlementConfigErrorField(amountError)).toBe('withholdingAmount')
  })
})
