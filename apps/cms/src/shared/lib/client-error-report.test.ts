import { describe, expect, it, vi } from 'vitest'
import {
  buildClientErrorReportPayload,
  createClientErrorReporter,
  toClientErrorMessage,
  toClientErrorScreenPath,
  type ClientErrorReportPayload,
} from './client-error-report'

const FIXED_NOW = new Date('2026-11-12T10:00:00.000Z')

function flush() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('toClientErrorScreenPath', () => {
  it('쿼리 문자열과 # 이후를 버리고 pathname만 남긴다', () => {
    expect(toClientErrorScreenPath('/members/12?tab=info&keyword=홍길동#memo')).toBe('/members/12')
    expect(toClientErrorScreenPath('/programs#section')).toBe('/programs')
    expect(toClientErrorScreenPath('https://cms.example.com/logs/bugs?page=2#top')).toBe('/logs/bugs')
  })

  it('빈 값은 / 로 보낸다', () => {
    expect(toClientErrorScreenPath('')).toBe('/')
    expect(toClientErrorScreenPath('?q=1')).toBe('/')
  })
})

describe('toClientErrorMessage', () => {
  it('Error는 이름·메시지만 쓴다', () => {
    expect(toClientErrorMessage(new TypeError('x is undefined'))).toBe('TypeError: x is undefined')
  })

  it('Error가 아닌 객체는 내용을 직렬화하지 않는다', () => {
    expect(toClientErrorMessage({ email: 'a@b.com', password: 'secret' })).toBe('Unknown error')
  })
})

describe('buildClientErrorReportPayload', () => {
  it('appCode·pathname·stack·userAgent·occurredAt을 채운다', () => {
    const error = new Error('boom')
    error.stack = 'Error: boom\n    at A (a.tsx:1:1)'
    const payload = buildClientErrorReportPayload('CMS', {
      error,
      componentStack: '\n    in Page\n    in Layout',
      pathname: '/notifications/alimtalk/history?status=FAILED',
      userAgent: 'Mozilla/5.0 test',
      occurredAt: FIXED_NOW,
    })
    expect(payload).toEqual({
      appCode: 'CMS',
      screenPath: '/notifications/alimtalk/history',
      message: 'Error: boom',
      stack: 'Error: boom\n    at A (a.tsx:1:1)\n    in Page\n    in Layout',
      userAgent: 'Mozilla/5.0 test',
      occurredAt: '2026-11-12T10:00:00.000Z',
    })
  })

  it('stack은 40줄까지만 보낸다', () => {
    const error = new Error('long')
    error.stack = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n')
    const payload = buildClientErrorReportPayload('ADMIN', {
      error,
      pathname: '/',
      occurredAt: FIXED_NOW,
    })
    expect(payload.appCode).toBe('ADMIN')
    expect(payload.stack?.split('\n')).toHaveLength(40)
  })
})

describe('createClientErrorReporter', () => {
  function setup(overrides: {
    loggedIn?: boolean
    send?: (payload: ClientErrorReportPayload<'CMS'>) => Promise<unknown>
    maxReportsPerPage?: number
  } = {}) {
    const send = vi.fn(overrides.send ?? (() => Promise.resolve(undefined)))
    const report = createClientErrorReporter({
      appCode: 'CMS',
      isLoggedIn: () => overrides.loggedIn ?? true,
      send,
      getPathname: () => '/members?keyword=x',
      getUserAgent: () => 'UA',
      now: () => FIXED_NOW,
      maxReportsPerPage: overrides.maxReportsPerPage,
    })
    return { send, report }
  }

  it('로그인하지 않았으면 보내지 않는다', () => {
    const { send, report } = setup({ loggedIn: false })
    report(new Error('boom'))
    expect(send).not.toHaveBeenCalled()
  })

  it('로그인 상태면 pathname만 담아 한 번 보낸다', () => {
    const { send, report } = setup()
    report(new Error('boom'))
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toMatchObject({ appCode: 'CMS', screenPath: '/members' })
  })

  it('같은 화면·같은 메시지는 한 번만 보낸다', () => {
    const { send, report } = setup()
    report(new Error('boom'))
    report(new Error('boom'))
    report(new Error('other'))
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('전송 실패는 조용히 버리고 재시도하지 않는다', async () => {
    const { send, report } = setup({
      send: () => Promise.reject(Object.assign(new Error('500'), { response: { status: 500 } })),
    })
    expect(() => report(new Error('boom'))).not.toThrow()
    await flush()
    expect(send).toHaveBeenCalledTimes(1)
    report(new Error('next'))
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('429를 받으면 그 페이지 로드에서는 더 보내지 않는다', async () => {
    const { send, report } = setup({
      send: () => Promise.reject(Object.assign(new Error('429'), { response: { status: 429 } })),
    })
    report(new Error('boom'))
    await flush()
    report(new Error('next'))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('send가 동기적으로 throw해도 밖으로 던지지 않는다', () => {
    const { report } = setup({
      send: () => {
        throw new Error('sync failure')
      },
    })
    expect(() => report(new Error('boom'))).not.toThrow()
  })

  it('보고 중 다시 들어온 오류는 보고하지 않는다 (재귀 방지)', () => {
    let reportRef: ((error: unknown) => void) | null = null
    const send = vi.fn(() => {
      reportRef?.(new Error('nested'))
      return Promise.resolve(undefined)
    })
    const report = createClientErrorReporter({
      appCode: 'CMS',
      isLoggedIn: () => true,
      send,
      getPathname: () => '/',
      getUserAgent: () => 'UA',
      now: () => FIXED_NOW,
    })
    reportRef = report
    report(new Error('boom'))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('페이지 로드당 최대 건수를 넘기면 보내지 않는다', () => {
    const { send, report } = setup({ maxReportsPerPage: 2 })
    report(new Error('a'))
    report(new Error('b'))
    report(new Error('c'))
    expect(send).toHaveBeenCalledTimes(2)
  })
})
