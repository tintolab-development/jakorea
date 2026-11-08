import { describe, expect, it } from 'vitest'
import {
  APPLICATION_REJECT_REASON_LENGTH_MESSAGE,
  formatApplicationRejectReasonErrorMessage,
} from './application-reject-reason'

function apiError(status: number, code: string, field: string | null) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: {
        success: false,
        data: null,
        message: '크기가 2에서 500 사이여야 합니다',
        error: { code, message: '크기가 2에서 500 사이여야 합니다', field },
      },
    },
  }
}

describe('반려 사유 검증 오류 문구', () => {
  it('VALIDATION_FAILED · field=reason이면 반려 사유 안내로 바꾼다', () => {
    expect(formatApplicationRejectReasonErrorMessage(apiError(400, 'VALIDATION_FAILED', 'reason'))).toBe(
      APPLICATION_REJECT_REASON_LENGTH_MESSAGE
    )
  })

  it('다른 필드·다른 코드는 처리하지 않는다', () => {
    expect(
      formatApplicationRejectReasonErrorMessage(apiError(400, 'VALIDATION_FAILED', 'scheduledAt'))
    ).toBeNull()
    expect(
      formatApplicationRejectReasonErrorMessage(apiError(409, 'APPLICATION_STATUS_CONFLICT', 'reason'))
    ).toBeNull()
    expect(formatApplicationRejectReasonErrorMessage(new Error('x'))).toBeNull()
  })
})
