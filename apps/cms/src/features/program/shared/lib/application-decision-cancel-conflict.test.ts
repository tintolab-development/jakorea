import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_STATUS_CONFLICT,
  FINAL_RESULT_NOT_FAILED,
  formatApplicationDecisionCancelConflictMessage,
} from '@/features/program/shared/lib/application-decision-cancel-conflict'

describe('formatApplicationDecisionCancelConflictMessage', () => {
  it('maps known 409 codes to user-facing messages', () => {
    const error = {
      response: {
        data: { code: FINAL_RESULT_NOT_FAILED, message: 'ignored' },
      },
    }
    expect(formatApplicationDecisionCancelConflictMessage(error)).toContain('최종 불합격 상태가 아니어')
  })

  it('returns null for unrelated errors', () => {
    expect(formatApplicationDecisionCancelConflictMessage(new Error('network'))).toBeNull()
  })

  it('maps DOCUMENT_STATUS_CONFLICT', () => {
    const error = {
      response: { data: { code: DOCUMENT_STATUS_CONFLICT } },
    }
    expect(formatApplicationDecisionCancelConflictMessage(error)).toContain('단계와 맞지 않는')
  })

  it('maps nested APPLICATION_DECISION_CONFLICT', () => {
    const error = {
      response: {
        data: {
          success: false,
          error: {
            code: 'APPLICATION_DECISION_CONFLICT',
            message: '현재 신청 상태에서는 승인 취소를 할 수 없습니다.',
          },
        },
      },
    }
    expect(formatApplicationDecisionCancelConflictMessage(error)).toContain(
      '현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.'
    )
  })
})
