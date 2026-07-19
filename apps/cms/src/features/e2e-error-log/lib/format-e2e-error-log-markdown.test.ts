import { describe, expect, it } from 'vitest'
import {
  buildE2eErrorLogMdFilename,
  formatE2eErrorLogMarkdown,
} from './format-e2e-error-log-markdown'
import type { E2eErrorLogEntry } from '../model/types'

const sample: E2eErrorLogEntry = {
  id: '1',
  occurredAt: '2026-07-20T07:39:10.000Z',
  situation: '대시보드',
  route: '/',
  method: 'GET',
  requestPath: '/api/admin/users',
  httpStatus: null,
  errorCode: 'NETWORK_ERROR',
  message: 'timeout of 30000ms exceeded',
  traceId: 'abc-123',
  requestBodyPreview: undefined,
  responseBodyPreview: '{"ok":false}',
}

describe('formatE2eErrorLogMarkdown', () => {
  it('요약·표·상세를 포함한 md를 만든다', () => {
    const md = formatE2eErrorLogMarkdown([sample])
    expect(md).toContain('# E2E 백엔드 에러 로그')
    expect(md).toContain('`NETWORK_ERROR` × 1')
    expect(md).toContain('| # | 발생 시각 |')
    expect(md).toContain('GET /api/admin/users')
    expect(md).toContain('#### response body')
    expect(md).toContain('{"ok":false}')
  })

  it('빈 목록도 유효한 md를 만든다', () => {
    const md = formatE2eErrorLogMarkdown([])
    expect(md).toContain('총 건수: 0')
    expect(md).toContain('_기록된 에러가 없습니다._')
  })
})

describe('buildE2eErrorLogMdFilename', () => {
  it('타임스탬프 파일명을 만든다', () => {
    const name = buildE2eErrorLogMdFilename(new Date('2026-07-20T07:41:11'))
    expect(name).toMatch(/^e2e-error-log-\d{8}-\d{6}\.md$/)
  })
})
