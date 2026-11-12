/**
 * 화면 오류 수집 (QA-0183) — 전역 오류 포착에서 부르는 보고 payload·전송 규칙.
 *
 * BE 계약: `POST /api/admin/logs/client-errors` (CMS 201, 홈페이지 Admin 204)
 * - `screenPath`는 pathname만 보낸다 (쿼리 문자열·`#` 이후 제외).
 * - `message`는 오류 이름·메시지만 쓴다. 화면 입력값·요청 body·상태 객체를 넣지 않는다.
 * - 보고 실패(429 포함)는 조용히 버린다. 재시도·알림·오류 화면 없음.
 * - 보고 중에 생긴 오류가 다시 보고되지 않도록 막는다.
 */

export const CLIENT_ERROR_REPORT_PATH = '/api/admin/logs/client-errors'

/** BE 저장 한도(메시지 255자·stack 40줄 8,000자·userAgent 512자)보다 넉넉하게, 검증 한도보다는 작게 자른다 */
const SCREEN_PATH_MAX = 1000
const MESSAGE_MAX = 1000
const STACK_MAX_LINES = 40
const STACK_MAX_CHARS = 8000
const USER_AGENT_MAX = 1000

/** 한 페이지 로드에서 보낼 최대 건수 — 같은 오류 반복으로 서버 한도(분당 20건)를 쓰지 않게 한다 */
const DEFAULT_MAX_REPORTS_PER_PAGE = 10

export type ClientErrorReportPayload<TAppCode extends string = string> = {
  appCode: TAppCode
  screenPath: string
  message: string
  stack?: string | null
  userAgent?: string | null
  occurredAt?: string | null
}

export type ClientErrorReportInput = {
  error: unknown
  /** React `errorInfo.componentStack` — 컴포넌트 이름만 담긴다 */
  componentStack?: string | null
  pathname: string
  userAgent?: string | null
  occurredAt?: Date
}

/** 쿼리 문자열·`#` 이후를 버리고 pathname만 남긴다. 전체 URL이 와도 pathname만 쓴다. */
export function toClientErrorScreenPath(pathnameOrUrl: string): string {
  let raw = (pathnameOrUrl ?? '').trim()
  if (/^https?:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).pathname
    } catch {
      raw = ''
    }
  }
  const pathname = (raw.split(/[?#]/, 1)[0] ?? '').trim()
  return (pathname || '/').slice(0, SCREEN_PATH_MAX)
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max)
}

/** 오류 이름·메시지만 쓴다. Error가 아닌 객체는 내용(입력값일 수 있음)을 직렬화하지 않는다. */
export function toClientErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name?.trim() || 'Error'
    const message = error.message?.trim() || ''
    if (!message) return clip(name, MESSAGE_MAX)
    return clip(message.startsWith(name) ? message : `${name}: ${message}`, MESSAGE_MAX)
  }
  if (typeof error === 'string' && error.trim()) return clip(error.trim(), MESSAGE_MAX)
  return 'Unknown error'
}

function toClientErrorStack(error: unknown, componentStack?: string | null): string | null {
  const parts: string[] = []
  if (error instanceof Error && typeof error.stack === 'string' && error.stack.trim()) {
    parts.push(error.stack)
  }
  if (typeof componentStack === 'string' && componentStack.trim()) {
    parts.push(componentStack)
  }
  if (parts.length === 0) return null
  const lines = parts
    .join('\n')
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim())
    .slice(0, STACK_MAX_LINES)
  return clip(lines.join('\n'), STACK_MAX_CHARS)
}

export function buildClientErrorReportPayload<TAppCode extends string>(
  appCode: TAppCode,
  input: ClientErrorReportInput
): ClientErrorReportPayload<TAppCode> {
  const userAgent = input.userAgent?.trim()
  return {
    appCode,
    screenPath: toClientErrorScreenPath(input.pathname),
    message: toClientErrorMessage(input.error),
    stack: toClientErrorStack(input.error, input.componentStack),
    userAgent: userAgent ? clip(userAgent, USER_AGENT_MAX) : null,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
  }
}

function readHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const status = (error as { response?: { status?: unknown } }).response?.status
  return typeof status === 'number' ? status : undefined
}

export type ClientErrorReporterOptions<TAppCode extends string> = {
  appCode: TAppCode
  /** 관리자 로그인 상태(역할 무관)일 때만 true */
  isLoggedIn: () => boolean
  /** 실제 전송. 실패는 reporter가 조용히 버린다 (호출부에서 재시도·알림 금지) */
  send: (payload: ClientErrorReportPayload<TAppCode>) => Promise<unknown>
  getPathname?: () => string
  getUserAgent?: () => string | null | undefined
  now?: () => Date
  maxReportsPerPage?: number
}

export type ClientErrorReporter = (error: unknown, componentStack?: string | null) => void

/**
 * 전역 오류 포착(onCaughtError·window error)에서 부르는 reporter.
 * 절대 throw하지 않고, 실패해도 재시도하지 않는다. 같은 화면·같은 메시지는 페이지 로드당 한 번만 보낸다.
 * 서버가 429를 주면 그 페이지 로드에서는 더 보내지 않는다.
 */
export function createClientErrorReporter<TAppCode extends string>(
  options: ClientErrorReporterOptions<TAppCode>
): ClientErrorReporter {
  const sentKeys = new Set<string>()
  const maxReports = options.maxReportsPerPage ?? DEFAULT_MAX_REPORTS_PER_PAGE
  let reporting = false
  let stopped = false

  return (error, componentStack) => {
    // 보고 처리 중 동기적으로 다시 들어온 오류는 보고하지 않는다 (재귀 방지)
    if (reporting || stopped) return
    reporting = true
    try {
      if (!options.isLoggedIn()) return
      if (sentKeys.size >= maxReports) return
      const payload = buildClientErrorReportPayload(options.appCode, {
        error,
        componentStack,
        pathname: options.getPathname?.() ?? window.location.pathname,
        userAgent: options.getUserAgent?.() ?? navigator.userAgent,
        occurredAt: options.now?.() ?? new Date(),
      })
      const key = `${payload.screenPath}\n${payload.message}`
      if (sentKeys.has(key)) return
      sentKeys.add(key)
      void options.send(payload).catch((sendError: unknown) => {
        if (readHttpStatus(sendError) === 429) stopped = true
      })
    } catch {
      // 보고 실패는 화면에 영향을 주지 않는다
    } finally {
      reporting = false
    }
  }
}
