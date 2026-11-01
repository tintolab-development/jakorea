import { describe, expect, it } from 'vitest'
import {
  getSettlementConfigErrorField,
  getSettlementApiErrorMessage,
  getSettlementApiErrorCode,
  getNormalizedSettlementApiError,
  isSettlementExportAlreadyDownloadedError,
  isSettlementExportReissueRequiredError,
  isPaymentStatementStatusConflictError,
  isTaxReportIdentityOrSnapshotMissingError,
  normalizeSettlementApiErrorCode,
  LEGACY_GEMINI_TAX_SNAPSHOT_MISSING_MESSAGE,
  TAX_REPORT_REQUIRED_IDENTITY_MISSING_MESSAGE,
  SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED_MESSAGE,
  SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID_MESSAGE,
  SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED_MESSAGE,
  GEMINI_TRAINING_REPORT_MISSING_MESSAGE,
} from './get-settlement-api-error'

describe('getSettlementApiErrorMessage', () => {
  it('409 PAYMENT_STATEMENT_STATUS_CONFLICT → 구체 message 우선', () => {
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

  it('409 STATUS_CONFLICT + BE 공통 문구 → FE conflict 안내', () => {
    const error = {
      response: {
        status: 409,
        data: {
          message: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          error: {
            code: 'PAYMENT_STATEMENT_STATUS_CONFLICT',
            message: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            field: 'status',
            details: { statementId: '1694948' },
          },
        },
      },
    }

    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '이미 확인된 지급조서가 포함되어 있습니다. 목록을 새로고침한 뒤 다시 확인해 주세요.'
    )
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
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '이미 다운로드한 정산 양식은 다시 받을 수 없습니다. 양식을 새로 발급해 주세요.'
    )
  })

  it('409 SENSITIVE_FILE_RELAY_REQUIRED → 전용 문구', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'SENSITIVE_FILE_RELAY_REQUIRED' } },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '민감 정산 파일은 일반 다운로드 주소로 받을 수 없습니다. 미리보기에서 엑셀 다운로드를 다시 시도해 주세요.'
    )
  })

  it('409 FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED → 재발급 안내', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED' } },
      },
    }
    expect(isSettlementExportReissueRequiredError(error)).toBe(true)
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '다운로드 토큰이 만료되었거나 유효하지 않습니다. 양식을 새로 발급해 주세요.'
    )
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

  it('GEMINI_TRAINING_REPORT_MISSING → 실적 시각 누락 안내', () => {
    const error = {
      response: {
        status: 500,
        data: {
          message: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          error: { code: 'GEMINI_TRAINING_REPORT_MISSING' },
        },
      },
    }
    expect(getSettlementApiErrorCode(error)).toBe('GEMINI_TRAINING_REPORT_MISSING')
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      GEMINI_TRAINING_REPORT_MISSING_MESSAGE
    )
  })

  it('409 LEGACY_GEMINI_TAX_SNAPSHOT_MISSING(+count/ids) → Gemini 스냅샷 안내', () => {
    const error = {
      response: {
        status: 409,
        data: {
          error: { code: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING:count=2;ids=101,102' },
        },
      },
    }
    expect(isTaxReportIdentityOrSnapshotMissingError(error)).toBe(true)
    expect(getSettlementApiErrorCode(error)).toBe('LEGACY_GEMINI_TAX_SNAPSHOT_MISSING')
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      `${LEGACY_GEMINI_TAX_SNAPSHOT_MISSING_MESSAGE} (지급 ID: 101, 102)`
    )
  })

  it('409 TAX_REPORT_REQUIRED_IDENTITY_MISSING → 신원정보 누락 안내', () => {
    const error = {
      response: {
        status: 409,
        data: {
          message: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          error: { code: 'TAX_REPORT_REQUIRED_IDENTITY_MISSING:count=1;ids=302' },
        },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      `${TAX_REPORT_REQUIRED_IDENTITY_MISSING_MESSAGE} (지급 ID: 302)`
    )
  })

  it('정정 단가·단위·차시 오류를 FE 한국어로 매핑한다', () => {
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 400,
            data: { error: { code: 'SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED' } },
          },
        },
        'fallback'
      )
    ).toBe(SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED_MESSAGE)
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 400,
            data: { error: { code: 'SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID' } },
          },
        },
        'fallback'
      )
    ).toBe(SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID_MESSAGE)
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 409,
            data: { error: { code: 'SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED' } },
          },
        },
        'fallback'
      )
    ).toBe(SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED_MESSAGE)
  })
})

describe('normalizeSettlementApiErrorCode', () => {
  it('접미사 없는 코드는 stableCode만 반환한다', () => {
    expect(normalizeSettlementApiErrorCode('PAYMENT_STATEMENT_STATUS_CONFLICT')).toEqual({
      rawCode: 'PAYMENT_STATEMENT_STATUS_CONFLICT',
      stableCode: 'PAYMENT_STATEMENT_STATUS_CONFLICT',
      missingCount: null,
      paymentIds: [],
    })
  })

  it('count/ids 접미사를 파싱하고 중복·비숫자를 버린다', () => {
    expect(
      normalizeSettlementApiErrorCode(
        'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING:count=2;ids=101,101,abc,102,-3'
      )
    ).toEqual({
      rawCode: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING:count=2;ids=101,101,abc,102,-3',
      stableCode: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING',
      missingCount: 2,
      paymentIds: [101, 102],
    })
  })

  it('잘못된 count/ids여도 stableCode는 유지한다', () => {
    expect(normalizeSettlementApiErrorCode('TAX_REPORT_REQUIRED_IDENTITY_MISSING:ids=')).toEqual({
      rawCode: 'TAX_REPORT_REQUIRED_IDENTITY_MISSING:ids=',
      stableCode: 'TAX_REPORT_REQUIRED_IDENTITY_MISSING',
      missingCount: null,
      paymentIds: [],
    })
    expect(normalizeSettlementApiErrorCode('TAX_REPORT_REQUIRED_IDENTITY_MISSING:count=x')).toEqual(
      {
        rawCode: 'TAX_REPORT_REQUIRED_IDENTITY_MISSING:count=x',
        stableCode: 'TAX_REPORT_REQUIRED_IDENTITY_MISSING',
        missingCount: null,
        paymentIds: [],
      }
    )
  })

  it('getNormalizedSettlementApiError는 axios 응답에서 동일 정규화를 한다', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING:count=1;ids=9' } },
      },
    }
    expect(getNormalizedSettlementApiError(error)).toEqual({
      rawCode: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING:count=1;ids=9',
      stableCode: 'LEGACY_GEMINI_TAX_SNAPSHOT_MISSING',
      missingCount: 1,
      paymentIds: [9],
    })
  })
})
