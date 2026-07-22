/**
 * Playwright — E2E 테스트 진행·API payload를 DEV Mock 스토어에 기록
 *
 * 저장: test-results/e2e-test-log-store.json
 * 조회: http://localhost:3000/e2e-error-log (테스트 로깅 탭)
 */

import type { Page, TestInfo, Response } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const STORE_MAX = 300
const PAYLOAD_MAX = 12_000
const RESPONSE_MAX = 2_000

type StoreFile = {
  version: 1
  items: Array<Record<string, unknown>>
}

export type CapturedApiCall = {
  occurredAt: string
  method: string
  url: string
  httpStatus: number
  requestPayload?: string
  responsePreview?: string
  isMutation: boolean
  isError: boolean
  errorCode?: string
}

function preview(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

function tryPrettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function parseErrorCode(bodyText: string): string | undefined {
  try {
    const data = JSON.parse(bodyText) as Record<string, unknown>
    const nested =
      data.error && typeof data.error === 'object'
        ? (data.error as Record<string, unknown>)
        : undefined
    const codeRaw = nested?.code ?? data.code
    if (codeRaw != null && String(codeRaw).trim() !== '') return String(codeRaw)
  } catch {
    // ignore
  }
  return undefined
}

function pathOfUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.pathname}${u.search}`
  } catch {
    return url
  }
}

function isDevLogUrl(url: string) {
  return url.includes('/__dev__/e2e-error-logs') || url.includes('/__dev__/e2e-test-logs')
}

function storeFilePath() {
  return path.join(process.cwd(), 'test-results', 'e2e-test-log-store.json')
}

function readStore(): StoreFile {
  const file = storeFilePath()
  try {
    if (!fs.existsSync(file)) return { version: 1, items: [] }
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as StoreFile
    if (parsed?.version === 1 && Array.isArray(parsed.items)) return parsed
  } catch {
    // ignore
  }
  return { version: 1, items: [] }
}

function writeStore(store: StoreFile) {
  const file = storeFilePath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  store.items = store.items.slice(0, STORE_MAX)
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8')
  return file
}

function appendEntries(entries: Array<Record<string, unknown>>) {
  if (entries.length === 0) return storeFilePath()
  const store = readStore()
  for (const entry of entries) {
    store.items.unshift(entry)
  }
  return writeStore(store)
}

function mapTestStatus(
  status: TestInfo['status']
): 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted' {
  if (status === 'passed') return 'passed'
  if (status === 'skipped') return 'skipped'
  if (status === 'timedOut') return 'timedOut'
  if (status === 'interrupted') return 'interrupted'
  return 'failed'
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** mutation·주요 API 호출을 네트워크에서 수집 */
export function installApiCallCapture(page: Page): {
  getCalls: () => Promise<CapturedApiCall[]>
  dispose: () => void
} {
  const calls: CapturedApiCall[] = []
  const pending = new Set<Promise<void>>()

  const onResponse = (res: Response) => {
    const url = res.url()
    if (!/\/api\//.test(url)) return
    if (isDevLogUrl(url)) return

    const method = res.request().method().toUpperCase()
    const status = res.status()
    const isMutation = /^(POST|PUT|PATCH|DELETE)$/.test(method)
    // GET 은 지표만 — body는 mutation·에러만 저장
    const shouldCaptureBody = isMutation || status >= 400

    const task = (async () => {
      let requestPayload: string | undefined
      let responsePreview: string | undefined
      let errorCode: string | undefined

      if (shouldCaptureBody) {
        try {
          const postData = res.request().postData()
          if (postData) {
            requestPayload = preview(tryPrettyJson(postData), PAYLOAD_MAX)
          }
        } catch {
          // ignore
        }
        try {
          const bodyText = await res.text()
          if (bodyText) {
            responsePreview = preview(tryPrettyJson(bodyText), RESPONSE_MAX)
            if (status >= 400) errorCode = parseErrorCode(bodyText)
          }
        } catch {
          // ignore
        }
      }

      calls.push({
        occurredAt: new Date().toISOString(),
        method,
        url,
        httpStatus: status,
        requestPayload,
        responsePreview,
        isMutation,
        isError: status >= 400,
        errorCode,
      })
    })().catch(() => undefined)

    pending.add(task)
    void task.finally(() => {
      pending.delete(task)
    })
  }

  page.on('response', onResponse)

  return {
    getCalls: async () => {
      await Promise.all([...pending])
      return [...calls]
    },
    dispose: () => {
      page.off('response', onResponse)
    },
  }
}

async function postToDevMockApi(
  baseURL: string,
  items: Array<Record<string, unknown>>
): Promise<boolean> {
  try {
    const res = await fetch(new URL('/__dev__/e2e-test-logs', baseURL).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items }),
    })
    return res.ok
  } catch {
    return false
  }
}

export type E2eTestLogNoteInput = {
  /** 예: edit:unchanged-fields / edit:changed-fields */
  phase: string
  message: string
  /** 펼침 상세 — JSON/텍스트 (requestPayload 슬롯에 표시) */
  detail?: string
}

/**
 * 테스트 중간에 note 항목을 `/e2e-error-log` 테스트 로깅 탭에 남깁니다.
 * (수정 E2E의 변경·미수정 필드 목록 등)
 */
export async function recordE2eTestLogNotes(args: {
  page: Page
  title: string
  titlePath?: string[]
  file?: string
  notes: E2eTestLogNoteInput[]
}): Promise<void> {
  const { page, title, notes } = args
  if (notes.length === 0) return

  let baseURL = 'http://localhost:3000'
  try {
    baseURL = new URL(page.url()).origin
  } catch {
    // keep default
  }

  const titlePath = args.titlePath ?? title.split(/\s*›\s*/)
  const occurredAt = new Date().toISOString()
  const entries = notes.map(note => ({
    id: newId('pw-note'),
    occurredAt,
    status: 'note' as const,
    title,
    titlePath,
    file: args.file,
    phase: note.phase,
    message: note.message,
    requestPayload: note.detail ? preview(tryPrettyJson(note.detail), PAYLOAD_MAX) : undefined,
  }))

  const synced = await postToDevMockApi(baseURL, entries)
  if (!synced) {
    appendEntries(entries)
  }
}

/**
 * 테스트 시작·종료·API mutation payload를 공유 스토어·Mock API에 남깁니다.
 */
export async function dumpE2eTestLogs(args: {
  testInfo: TestInfo
  calls: CapturedApiCall[]
  startedAtIso: string
}) {
  const { testInfo, calls, startedAtIso } = args
  const title = testInfo.titlePath.join(' › ')
  const titlePath = [...testInfo.titlePath]
  const project = testInfo.project.name
  const file = testInfo.file
  const retry = testInfo.retry
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000'
  const durationMs = Math.max(0, Date.now() - Date.parse(startedAtIso))
  const status = mapTestStatus(testInfo.status)

  const apiOkCount = calls.filter(c => !c.isError).length
  const apiErrorCount = calls.filter(c => c.isError).length
  const mutationCount = calls.filter(c => c.isMutation).length
  const errorCodes = [
    ...new Set(
      calls
        .map(c => c.errorCode)
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
    ),
  ]

  const metrics = {
    apiOkCount,
    apiErrorCount,
    mutationCount,
    errorCodes,
    durationMs,
  }

  const entries: Array<Record<string, unknown>> = []

  // 시작
  entries.push({
    id: newId('pw-start'),
    occurredAt: startedAtIso,
    status: 'started',
    title,
    titlePath,
    file,
    project,
    retry,
    phase: 'test:start',
    message: '테스트 시작',
  })

  // mutation API (payload 포함) — 시간순
  const mutations = calls.filter(c => c.isMutation)
  for (const call of mutations) {
    entries.push({
      id: newId('pw-api'),
      occurredAt: call.occurredAt,
      status: 'api',
      title,
      titlePath,
      file,
      project,
      retry,
      phase: call.isError ? 'api:error' : 'api:mutation',
      method: call.method,
      requestPath: pathOfUrl(call.url),
      httpStatus: call.httpStatus,
      requestPayload: call.requestPayload,
      responsePreview: call.responsePreview,
      message: `${call.method} ${pathOfUrl(call.url)} → ${call.httpStatus}`,
      errorMessage: call.isError
        ? call.errorCode || `HTTP ${call.httpStatus}`
        : undefined,
    })
  }

  // 종료
  entries.push({
    id: newId('pw-end'),
    occurredAt: new Date().toISOString(),
    status,
    title,
    titlePath,
    file,
    project,
    retry,
    durationMs,
    phase: 'test:end',
    metrics,
    message: `테스트 ${status}`,
    errorMessage:
      status === 'failed' || status === 'timedOut'
        ? testInfo.errors.map(e => e.message).filter(Boolean).join('\n').slice(0, 2_000) ||
          undefined
        : undefined,
  })

  const synced = await postToDevMockApi(baseURL, entries)
  if (synced) {
    console.error('[e2e-test-log] DEV Mock API 동기화 완료')
  } else {
    // Vite Mock API가 없으면 Playwright가 디스크 스토어에 직접 기록
    const storeFile = appendEntries(entries)
    console.error(
      `[e2e-test-log] DEV Mock API 실패 — 스토어 직접 저장: ${storeFile}`
    )
  }
  console.error(
    `[e2e-test-log] ${status} · ${title} · ${durationMs}ms · mutations=${mutationCount} errors=${apiErrorCount}`
  )
  console.error(`[e2e-test-log] 확인: http://localhost:3000/e2e-error-log`)

  try {
    const outDir = path.join(process.cwd(), 'test-results')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(
      path.join(outDir, 'e2e-test-log-latest.json'),
      JSON.stringify(
        {
          test: title,
          status,
          durationMs,
          metrics,
          mutations: mutations.map(m => ({
            method: m.method,
            path: pathOfUrl(m.url),
            httpStatus: m.httpStatus,
            requestPayload: m.requestPayload,
            responsePreview: m.responsePreview,
          })),
        },
        null,
        2
      ),
      'utf8'
    )
  } catch {
    // ignore
  }

  await testInfo.attach('e2e-test-log.json', {
    body: JSON.stringify({ title, status, durationMs, metrics, entries }, null, 2),
    contentType: 'application/json',
  })
}
