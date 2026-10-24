import { describe, expect, it } from 'vitest'
import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  PerformanceRemoteUnavailableError,
  getPerformanceExportErrorMessage,
  getPerformanceLoadErrorMessage,
} from './performance-errors'

describe('performance-errors', () => {
  it('distinguishes unavailable API, authentication, and zero-result UI states', () => {
    expect(
      getPerformanceLoadErrorMessage(new PerformanceRemoteUnavailableError('API_NOT_CONFIGURED'))
    ).toContain('연결되지 않았습니다')
    expect(
      getPerformanceLoadErrorMessage(new PerformanceRemoteUnavailableError('AUTH_REQUIRED'))
    ).toContain('인증')
  })

  it('maps 401 and 403 export failures to permission-specific messages', () => {
    const config = { headers: {} } as InternalAxiosRequestConfig
    const unauthorized = new axios.AxiosError('expired', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
      data: null,
    })
    const forbidden = new axios.AxiosError('forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
      data: null,
    })

    expect(getPerformanceExportErrorMessage(unauthorized)).toContain('인증')
    expect(getPerformanceExportErrorMessage(forbidden)).toContain('엑셀 다운로드 권한')
  })
})
