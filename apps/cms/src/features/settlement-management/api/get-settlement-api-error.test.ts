import { describe, expect, it } from 'vitest'
import {
  getSettlementConfigErrorField,
  getSettlementApiErrorMessage,
  getSettlementApiErrorCode,
  readAccountPaymentMissingAccountIds,
  getFileDownloadPasswordFormError,
  getNormalizedSettlementApiError,
  isSettlementExportAlreadyDownloadedError,
  isSettlementExportReissueRequiredError,
  isPaymentStatementStatusConflictError,
  isGeminiPaymentStatementPreConsentRequiredError,
  isTaxReportIdentityOrSnapshotMissingError,
  normalizeSettlementApiErrorCode,
  LEGACY_GEMINI_TAX_SNAPSHOT_MISSING_MESSAGE,
  TAX_REPORT_REQUIRED_IDENTITY_MISSING_MESSAGE,
  SETTLEMENT_CORRECTION_UNIT_AMOUNT_REQUIRED_MESSAGE,
  SETTLEMENT_CORRECTION_CALCULATION_UNIT_INVALID_MESSAGE,
  SETTLEMENT_CORRECTION_CLASS_COUNT_REQUIRED_MESSAGE,
  GEMINI_TRAINING_REPORT_MISSING_MESSAGE,
  GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED_MESSAGE,
  GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED_MESSAGE,
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

  it('409 Gemini 사전 동의 미완료·정정 불가 → 서버 message를 그대로 쓴다', () => {
    const preConsentError = {
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: 'GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED',
            message: '서버 사전 동의 안내',
          },
        },
      },
    }
    const correctionError = {
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: 'GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED',
            message: '서버 정정 불가 안내',
          },
        },
      },
    }
    expect(getSettlementApiErrorMessage(preConsentError, 'fallback')).toBe('서버 사전 동의 안내')
    expect(getSettlementApiErrorMessage(correctionError, 'fallback')).toBe('서버 정정 불가 안내')
  })

  it('409 Gemini 사전 동의 미완료만 재조회 대상으로 판정한다', () => {
    const build = (status: number, code: string) => ({
      response: { status, data: { error: { code, message: 'm' } } },
    })
    expect(
      isGeminiPaymentStatementPreConsentRequiredError(
        build(409, 'GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED')
      )
    ).toBe(true)
    expect(
      isGeminiPaymentStatementPreConsentRequiredError(
        build(400, 'GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED')
      )
    ).toBe(false)
    expect(
      isGeminiPaymentStatementPreConsentRequiredError(
        build(409, 'GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED')
      )
    ).toBe(false)
  })

  it('409 Gemini 사전 동의 미완료·정정 불가 + 서버 공통 문구 → FE 안내', () => {
    const build = (code: string) => ({
      response: {
        status: 409,
        data: { message: '요청한 변경이 기존 데이터와 충돌합니다.', error: { code } },
      },
    })
    expect(
      getSettlementApiErrorMessage(build('GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED'), 'fb')
    ).toBe(GEMINI_PAYMENT_STATEMENT_PRE_CONSENT_REQUIRED_MESSAGE)
    expect(
      getSettlementApiErrorMessage(build('GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED'), 'fb')
    ).toBe(GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED_MESSAGE)
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

  it('409 SETTLEMENT_BANK_ACCOUNT_REQUIRED는 지급조서 사전 동의서 완료를 안내한다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          message: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          error: { code: 'SETTLEMENT_BANK_ACCOUNT_REQUIRED', field: 'bankAccount' },
        },
      },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe(
      '지급조서 사전 동의서를 작성·완료하세요. 등록된 정산 계좌가 없어 계좌이체를 생성할 수 없습니다.'
    )
  })

  it('400 DOWNLOAD_PASSWORD_REQUIRED/INVALID는 서버 파일 암호 문구를 쓴다', () => {
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 400,
            data: {
              message: '파일 암호를 입력해 주세요.',
              error: { code: 'DOWNLOAD_PASSWORD_REQUIRED', field: 'password' },
            },
          },
        },
        'fallback'
      )
    ).toBe('파일 암호를 입력해 주세요.')
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 400,
            data: {
              message:
                '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
              error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
            },
          },
        },
        'fallback'
      )
    ).toBe('파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.')
    expect(
      getFileDownloadPasswordFormError({
        response: {
          status: 400,
          data: {
            message:
              '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
            error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
          },
        },
      })
    ).toBe('파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.')
  })

  it('403 CONSENT_SENSITIVE_FILE_FORBIDDEN는 정산 조회 권한 문구로 덮지 않는다', () => {
    expect(
      getSettlementApiErrorMessage(
        {
          response: {
            status: 403,
            data: {
              message:
                '성범죄 경력조회 동의서와 행정정보 공동이용 사전동의서는 Master와 해당 프로그램 Program Owner만 열람·다운로드할 수 있습니다.',
              error: { code: 'CONSENT_SENSITIVE_FILE_FORBIDDEN' },
            },
          },
        },
        'fallback'
      )
    ).toBe(
      '성범죄 경력조회 동의서와 행정정보 공동이용 사전동의서는 Master와 해당 프로그램 Program Owner만 열람·다운로드할 수 있습니다.'
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

  it('409 ACCOUNT_PAYMENT_ACCOUNT_MISSING: 서버 문구, 비면 FE 문구, details.accountPaymentIds 파싱 (E2)', () => {
    const withMessage = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '지급 계좌 정보가 없어 지급 완료 처리할 수 없어요. 회원의 사전 동의서 계좌 정보를 확인해 주세요.',
          error: { code: 'ACCOUNT_PAYMENT_ACCOUNT_MISSING', details: { accountPaymentIds: '11,12' } },
        },
      },
    }
    expect(getSettlementApiErrorMessage(withMessage, 'fallback')).toBe(
      '지급 계좌 정보가 없어 지급 완료 처리할 수 없어요. 회원의 사전 동의서 계좌 정보를 확인해 주세요.'
    )
    expect(readAccountPaymentMissingAccountIds(withMessage)).toEqual([11, 12])
    const codeOnly = {
      response: { status: 409, data: { error: { code: 'ACCOUNT_PAYMENT_ACCOUNT_MISSING' } } },
    }
    expect(getSettlementApiErrorMessage(codeOnly, 'fallback')).toBe(
      '지급 계좌 정보가 없어 지급 완료 처리할 수 없어요. 회원의 사전 동의서 계좌 정보를 확인해 주세요.'
    )
    expect(readAccountPaymentMissingAccountIds(codeOnly)).toEqual([])
  })

  it('400 TAX_REPORT_NO_ELIGIBLE_SELECTION: 세금신고 대상 없음 문구 (E1)', () => {
    const error = {
      response: { status: 400, data: { error: { code: 'TAX_REPORT_NO_ELIGIBLE_SELECTION' } } },
    }
    expect(getSettlementApiErrorMessage(error, 'fallback')).toBe('선택한 건 중 세금신고 대상이 없어요.')
  })
})
