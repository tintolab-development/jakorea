import { AxiosError, CanceledError, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { classifyRefreshFailure } from './refresh-failure'

const config = { headers: {} } as InternalAxiosRequestConfig

function withStatus(status: number) {
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, {
    data: {},
    status,
    statusText: '',
    headers: {},
    config,
  })
}

describe('QA-0137 새로고침 refresh 실패 분류', () => {
  it.each([400, 401, 403])('%s는 세션 종료(session-invalid)', status => {
    expect(classifyRefreshFailure(withStatus(status))).toBe('session-invalid')
  })

  it.each([404, 409, 422, 429, 500, 502, 503, 504])('%s는 확인 못함(transient)', status => {
    expect(classifyRefreshFailure(withStatus(status))).toBe('transient')
  })

  it('네트워크 오류(응답 없음)는 transient', () => {
    expect(classifyRefreshFailure(new AxiosError('Network Error', 'ERR_NETWORK', config))).toBe('transient')
  })

  it('요청 시간 초과는 transient', () => {
    expect(classifyRefreshFailure(new AxiosError('timeout', 'ECONNABORTED', config))).toBe('transient')
  })

  it('중단·취소된 요청도 transient', () => {
    expect(classifyRefreshFailure(new CanceledError())).toBe('transient')
  })

  it('응답 형식 오류 등 axios 밖의 오류도 transient', () => {
    expect(classifyRefreshFailure(new Error('Invalid refresh response: missing access token'))).toBe(
      'transient'
    )
  })
})
