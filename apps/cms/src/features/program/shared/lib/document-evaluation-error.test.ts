import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_EVALUATION_ERROR_FALLBACK,
  readDocumentEvaluationErrorMessage,
  shouldShowDocumentEvaluationErrorAlert,
} from './document-evaluation-error'

describe('readDocumentEvaluationErrorMessage', () => {
  it('백엔드 error.message를 그대로 쓴다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: 'DOCUMENT_EVALUATION_LOCKED',
            message: '서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.',
          },
        },
      },
    }
    expect(readDocumentEvaluationErrorMessage(error)).toBe(
      '서류 합격 처리된 신청은 담당자 평가를 변경할 수 없습니다.'
    )
  })

  it('top-level message를 그대로 쓴다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '최종 결과가 확정되어 담당자 평가를 수정할 수 없습니다.',
        },
      },
    }
    expect(readDocumentEvaluationErrorMessage(error)).toBe(
      '최종 결과가 확정되어 담당자 평가를 수정할 수 없습니다.'
    )
  })

  it('응답 body가 없으면 fallback을 쓴다', () => {
    expect(readDocumentEvaluationErrorMessage(new Error('network'))).toBe('network')
    expect(readDocumentEvaluationErrorMessage({})).toBe(DOCUMENT_EVALUATION_ERROR_FALLBACK)
  })

  it('글로벌 Alert가 이미 뜬 오류는 로컬 중복 안내를 생략한다', () => {
    const error = { __cmsGlobalErrorAlertShown: true }
    expect(shouldShowDocumentEvaluationErrorAlert(error)).toBe(false)
    expect(shouldShowDocumentEvaluationErrorAlert(new Error('fail'))).toBe(true)
  })
})
