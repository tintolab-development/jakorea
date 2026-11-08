import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { summarizeGeminiImportFailure } from './import-failure-log'
import { GeminiImportPreviewFailureError } from './import-preview-failure'

describe('summarizeGeminiImportFailure', () => {
  it('행별 실패는 행 사유와 종류를 남긴다', () => {
    const error = new GeminiImportPreviewFailureError('3행: 등록할 수 없는 행입니다.', 'GENERAL')
    expect(summarizeGeminiImportFailure(error)).toEqual({
      kind: 'ROW_FAILURE',
      previewFailureKind: 'GENERAL',
      message: '3행: 등록할 수 없는 행입니다.',
    })
  })

  it('요청 전체 400은 상태·코드·필드·traceId만 남기고 요청 값은 남기지 않는다', () => {
    const error = new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST')
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '전화번호 형식이 올바르지 않습니다.',
          field: 'rows[11].instructorPhone',
          traceId: 'trace-1',
          details: { 'rows[11].instructorPhone': '010 3327 5124' },
        },
      },
    }

    const summary = summarizeGeminiImportFailure(error)
    expect(summary).toEqual({
      kind: 'HTTP',
      message: '전화번호 형식이 올바르지 않습니다.',
      status: 400,
      code: 'VALIDATION_FAILED',
      field: 'rows[11].instructorPhone',
      traceId: 'trace-1',
    })
    expect(JSON.stringify(summary)).not.toContain('3327')
  })

  it('그 외 오류는 메시지만 남긴다', () => {
    expect(summarizeGeminiImportFailure(new Error('boom'))).toEqual({
      kind: 'UNKNOWN',
      message: 'boom',
    })
  })
})
