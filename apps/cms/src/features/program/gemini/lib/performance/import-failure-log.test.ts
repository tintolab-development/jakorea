import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  isGeminiImportAuthFailure,
  isGeminiImportTransientFailure,
  summarizeGeminiImportFailure,
} from './import-failure-log'
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

describe('isGeminiImportTransientFailure', () => {
  const httpError = (status?: number) => {
    const error = new AxiosError('request failed', status == null ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE')
    if (status != null) {
      error.response = {
        status,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {},
      }
    }
    return error
  }

  it.each([undefined, 500, 502, 503, 408, 429])('서버·네트워크 실패(%s)는 재시도 안내 대상이다', status => {
    expect(isGeminiImportTransientFailure(httpError(status))).toBe(true)
  })

  it.each([400, 403, 404, 409])('4xx(%s)는 재시도 안내 대상이 아니다', status => {
    expect(isGeminiImportTransientFailure(httpError(status))).toBe(false)
  })

  it('행별 실패·양식 오류는 재시도 안내 대상이 아니다', () => {
    expect(
      isGeminiImportTransientFailure(new GeminiImportPreviewFailureError('2행: 오류', 'GENERAL'))
    ).toBe(false)
    expect(isGeminiImportTransientFailure(new Error('양식 오류'))).toBe(false)
  })
})

describe('isGeminiImportAuthFailure', () => {
  const httpError = (status: number) => {
    const error = new AxiosError('request failed', 'ERR_BAD_REQUEST')
    error.response = { status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: {} }
    return error
  }

  it.each([401, 403])('%s는 공통 로그인·권한 안내 대상이다', status => {
    expect(isGeminiImportAuthFailure(httpError(status))).toBe(true)
  })

  it.each([400, 500])('%s는 공통 로그인·권한 안내 대상이 아니다', status => {
    expect(isGeminiImportAuthFailure(httpError(status))).toBe(false)
  })
})
