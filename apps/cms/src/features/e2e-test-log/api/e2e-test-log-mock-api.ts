/**
 * E2E 테스트 진행 로그 — Mock API 클라이언트
 *
 * DEV Vite 플러그인(`GET/POST/DELETE /__dev__/e2e-test-logs`)이 디스크에 저장하므로
 * Playwright·브라우저의 `/e2e-error-log` «테스트 로깅» 탭이 같은 로그를 봅니다.
 */

import type {
  E2eTestLogCreateRequest,
  E2eTestLogEntry,
  E2eTestLogListResponse,
} from '@/features/e2e-test-log/model/types'

export const E2E_TEST_LOG_STORAGE_KEY = 'cms.jakorea.e2eTestLogs.v1'
export const E2E_TEST_LOG_MOCK_API_PATH = '/__dev__/e2e-test-logs'
const MAX_ENTRIES = 300

type StorageFile = {
  version: 1
  items: E2eTestLogEntry[]
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readLocal(): StorageFile {
  if (!canUseStorage()) return { version: 1, items: [] }
  try {
    const raw = localStorage.getItem(E2E_TEST_LOG_STORAGE_KEY)
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
  localStorage.setItem(E2E_TEST_LOG_STORAGE_KEY, JSON.stringify(file))
}

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `e2e-test-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function buildByStatus(items: E2eTestLogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = item.status || '(unknown)'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function buildSummary(items: E2eTestLogEntry[]): E2eTestLogListResponse['data']['summary'] {
  const terminal = items.filter(i =>
    ['passed', 'failed', 'skipped', 'timedOut', 'interrupted'].includes(i.status)
  )
  const durations = terminal
    .map(i => i.durationMs)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)
  const avgDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

  let apiCallTotal = 0
  let mutationTotal = 0
  for (const item of items) {
    apiCallTotal += item.metrics?.apiOkCount ?? 0
    apiCallTotal += item.metrics?.apiErrorCount ?? 0
    mutationTotal += item.metrics?.mutationCount ?? 0
    if (item.status === 'api' && item.method && /^(POST|PUT|PATCH|DELETE)$/i.test(item.method)) {
      mutationTotal += 1
    }
  }

  return {
    runCount: terminal.length,
    passed: terminal.filter(i => i.status === 'passed').length,
    failed: terminal.filter(i => i.status === 'failed' || i.status === 'timedOut').length,
    skipped: terminal.filter(i => i.status === 'skipped').length,
    avgDurationMs,
    apiCallTotal,
    mutationTotal,
  }
}

function toEntry(input: E2eTestLogCreateRequest): E2eTestLogEntry {
  return {
    id: input.id ?? newId(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    status: input.status,
    title: input.title,
    titlePath: Array.isArray(input.titlePath) ? input.titlePath : [input.title],
    file: input.file,
    project: input.project,
    retry: input.retry,
    durationMs: input.durationMs,
    phase: input.phase,
    method: input.method,
    requestPath: input.requestPath,
    httpStatus: input.httpStatus ?? null,
    requestPayload: input.requestPayload,
    responsePreview: input.responsePreview,
    metrics: input.metrics,
    message: input.message,
    errorMessage: input.errorMessage,
  }
}

function persistLocal(entry: E2eTestLogEntry): E2eTestLogEntry {
  const file = readLocal()
  file.items = [entry, ...file.items].slice(0, MAX_ENTRIES)
  writeLocal(file)
  return entry
}

export function postE2eTestLogToDevServer(input: E2eTestLogCreateRequest): void {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return
  void fetch(E2E_TEST_LOG_MOCK_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => undefined)
}

export function createE2eTestLogSync(input: E2eTestLogCreateRequest): E2eTestLogEntry {
  const entry = persistLocal(toEntry(input))
  postE2eTestLogToDevServer(entry)
  return entry
}

async function listFromDevServer(): Promise<E2eTestLogListResponse | null> {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return null
  try {
    const res = await fetch(E2E_TEST_LOG_MOCK_API_PATH, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as E2eTestLogListResponse
  } catch {
    return null
  }
}

function toListResponse(items: E2eTestLogEntry[]): E2eTestLogListResponse {
  const sorted = [...items].sort((a, b) =>
    a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0
  )
  return {
    success: true,
    data: {
      items: sorted,
      total: sorted.length,
      byStatus: buildByStatus(sorted),
      summary: buildSummary(sorted),
    },
  }
}

export const e2eTestLogMockApi = {
  async list(): Promise<E2eTestLogListResponse> {
    const remote = await listFromDevServer()
    if (remote?.success) return remote
    return toListResponse(readLocal().items)
  },

  async create(input: E2eTestLogCreateRequest): Promise<{ success: true; data: E2eTestLogEntry }> {
    return { success: true, data: createE2eTestLogSync(input) }
  },

  async clear(): Promise<{ success: true; data: { cleared: number } }> {
    let cleared = 0
    if (import.meta.env.DEV) {
      try {
        const res = await fetch(E2E_TEST_LOG_MOCK_API_PATH, { method: 'DELETE' })
        if (res.ok) {
          const body = (await res.json()) as { data?: { cleared?: number } }
          cleared = body.data?.cleared ?? 0
        }
      } catch {
        // fall through
      }
    }
    const file = readLocal()
    if (cleared === 0) cleared = file.items.length
    writeLocal({ version: 1, items: [] })
    return { success: true, data: { cleared } }
  },
}
