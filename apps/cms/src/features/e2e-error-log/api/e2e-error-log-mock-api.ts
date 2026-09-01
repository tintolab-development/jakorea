/**
 * E2E 백엔드 에러 로그 — Mock API 클라이언트
 *
 * DEV Vite 플러그인(`GET/POST/DELETE /__dev__/e2e-error-logs`)이 디스크에 저장하므로
 * Playwright·일반 브라우저의 `/e2e-error-log` 페이지가 같은 로그를 봅니다.
 * localStorage 는 보조 캐시입니다.
 */

import type {
  E2eErrorCodeSummary,
  E2eErrorLogCreateRequest,
  E2eErrorLogEntry,
  E2eErrorLogListResponse,
} from '@/features/e2e-error-log/model/types'

export const E2E_ERROR_LOG_STORAGE_KEY = 'cms.jakorea.e2eErrorLogs.v1'
export const E2E_ERROR_LOG_MOCK_API_PATH = '/__dev__/e2e-error-logs'
const MAX_ENTRIES = 200

type StorageFile = {
  version: 1
  items: E2eErrorLogEntry[]
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readLocal(): StorageFile {
  if (!canUseStorage()) return { version: 1, items: [] }
  try {
    const raw = localStorage.getItem(E2E_ERROR_LOG_STORAGE_KEY)
    if (!raw) return { version: 1, items: [] }
    const parsed = JSON.parse(raw) as StorageFile
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] }
    }
    return parsed
  } catch {
    return { version: 1, items: [] }
  }
}

function writeLocal(file: StorageFile) {
  if (!canUseStorage()) return
  localStorage.setItem(E2E_ERROR_LOG_STORAGE_KEY, JSON.stringify(file))
}

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `e2e-err-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function buildByErrorCode(items: E2eErrorLogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const code = item.errorCode || '(unknown)'
    counts[code] = (counts[code] ?? 0) + 1
  }
  return counts
}

function toEntry(input: E2eErrorLogCreateRequest): E2eErrorLogEntry {
  return {
    id: input.id ?? newId(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    situation: input.situation,
    route: input.route,
    method: input.method,
    requestPath: input.requestPath,
    httpStatus: input.httpStatus,
    errorCode: input.errorCode,
    message: input.message,
    traceId: input.traceId,
    requestBodyPreview: input.requestBodyPreview,
    responseBodyPreview: input.responseBodyPreview,
  }
}

function persistLocal(entry: E2eErrorLogEntry): E2eErrorLogEntry {
  const file = readLocal()
  file.items = [entry, ...file.items].slice(0, MAX_ENTRIES)
  writeLocal(file)
  return entry
}

/** 공유 Mock API(Vite)에 비동기 POST — 실패해도 무시 */
export function postE2eErrorLogToDevServer(input: E2eErrorLogCreateRequest): void {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return
  void fetch(E2E_ERROR_LOG_MOCK_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => undefined)
}

/** axios 인터셉터용 — localStorage 동기 + DEV 서버 공유 저장 */
export function createE2eErrorLogSync(input: E2eErrorLogCreateRequest): E2eErrorLogEntry {
  const entry = persistLocal(toEntry(input))
  postE2eErrorLogToDevServer(entry)
  return entry
}

async function listFromDevServer(): Promise<E2eErrorLogListResponse | null> {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return null
  try {
    const res = await fetch(E2E_ERROR_LOG_MOCK_API_PATH, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as E2eErrorLogListResponse
  } catch {
    return null
  }
}

/** Mock API — DEV 서버 우선, 실패 시 localStorage */
export const e2eErrorLogMockApi = {
  async list(): Promise<E2eErrorLogListResponse> {
    const remote = await listFromDevServer()
    if (remote?.success) return remote

    const items = [...readLocal().items].sort((a, b) =>
      a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0
    )
    return {
      success: true,
      data: {
        items,
        total: items.length,
        byErrorCode: buildByErrorCode(items),
      },
    }
  },

  async create(input: E2eErrorLogCreateRequest): Promise<{ success: true; data: E2eErrorLogEntry }> {
    return { success: true, data: createE2eErrorLogSync(input) }
  },

  async clear(): Promise<{ success: true; data: { cleared: number } }> {
    let cleared = 0
    if (import.meta.env.DEV) {
      try {
        const res = await fetch(E2E_ERROR_LOG_MOCK_API_PATH, { method: 'DELETE' })
        if (res.ok) {
          const body = (await res.json()) as { data?: { cleared?: number } }
          cleared = body.data?.cleared ?? 0
        }
      } catch {
        // fall through to local
      }
    }
    const file = readLocal()
    if (cleared === 0) cleared = file.items.length
    writeLocal({ version: 1, items: [] })
    return { success: true, data: { cleared } }
  },

  async summarizeByErrorCode(): Promise<{ success: true; data: E2eErrorCodeSummary[] }> {
    const list = await this.list()
    const summaries = Object.entries(list.data.byErrorCode)
      .map(([errorCode, count]) => ({ errorCode, count }))
      .sort((a, b) => b.count - a.count || a.errorCode.localeCompare(b.errorCode))
    return { success: true, data: summaries }
  },
}
