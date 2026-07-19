import type { Page, TestInfo, Response } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/** 앱 Mock API와 동일 키 — 참고용 */
const E2E_ERROR_LOG_STORAGE_KEY = 'cms.jakorea.e2eErrorLogs.v1'

export type CapturedApiError = {
  occurredAt: string
  method: string
  url: string
  httpStatus: number
  errorCode: string
  message: string
  traceId?: string
  responseBodyPreview?: string
}

function preview(text: string, max = 800): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

function parseErrorMeta(bodyText: string): {
  errorCode: string
  message: string
  traceId?: string
} {
  try {
    const data = JSON.parse(bodyText) as Record<string, unknown>
    const nested =
      data.error && typeof data.error === 'object'
        ? (data.error as Record<string, unknown>)
        : undefined
    const codeRaw = nested?.code ?? data.code
    const errorCode =
      codeRaw != null && String(codeRaw).trim() !== '' ? String(codeRaw) : 'UNKNOWN'
    const messageRaw = nested?.message ?? data.message
    const message =
      typeof messageRaw === 'string' && messageRaw.trim()
        ? messageRaw
        : errorCode !== 'UNKNOWN'
          ? errorCode
          : bodyText.slice(0, 200)
    const traceRaw = nested?.traceId ?? data.traceId
    const traceId = typeof traceRaw === 'string' && traceRaw ? traceRaw : undefined
    return { errorCode, message, traceId }
  } catch {
    return { errorCode: 'UNKNOWN', message: bodyText.slice(0, 200) || '(empty body)' }
  }
}

/**
 * Playwright 네트워크 레벨에서 백엔드 실패(4xx/5xx)를 수집합니다.
 * 앱 localStorage(`/e2e-error-log`)와 무관하게 터미널·리포트에 남깁니다.
 *
 * 주의: `response` 핸들러에서 body 를 읽으므로 **테스트 종료 전 `await getErrors()`**
 * 로 in-flight 수집을 기다려야 누락이 없습니다.
 */
export function installApiErrorCapture(page: Page): {
  getErrors: () => Promise<CapturedApiError[]>
  dispose: () => void
} {
  const errors: CapturedApiError[] = []
  const pending = new Set<Promise<void>>()

  const onResponse = (res: Response) => {
    const status = res.status()
    if (status < 400) return
    const url = res.url()
    // Mock 로그 API 자체·정적 자산 제외
    if (!/\/api\//.test(url)) return
    if (url.includes('/__dev__/e2e-error-logs')) return

    const task = (async () => {
      let bodyText = ''
      try {
        bodyText = await res.text()
      } catch {
        bodyText = ''
      }
      const meta = parseErrorMeta(bodyText)
      const finalCode =
        meta.errorCode === 'UNKNOWN' ? `HTTP_${status}` : meta.errorCode

      errors.push({
        occurredAt: new Date().toISOString(),
        method: res.request().method(),
        url,
        httpStatus: status,
        errorCode: finalCode,
        message: meta.message,
        traceId: meta.traceId,
        responseBodyPreview: bodyText ? preview(bodyText) : undefined,
      })
    })().catch(() => undefined)

    pending.add(task)
    void task.finally(() => {
      pending.delete(task)
    })
  }

  page.on('response', onResponse)

  return {
    getErrors: async () => {
      // body 파싱 중인 핸들러가 끝나기 전에 teardown 하면 로그가 빠짐
      await Promise.all([...pending])
      return [...errors]
    },
    dispose: () => {
      page.off('response', onResponse)
    },
  }
}

function printErrorsToTerminal(errors: CapturedApiError[], source: string) {
  // Playwright list reporter 에서도 보이도록 stderr 사용
  console.error('\n========== E2E 백엔드 에러 로그 ==========')
  console.error(`source: ${source}`)
  if (errors.length === 0) {
    console.error('(수집된 API 에러 없음)')
    console.error('========================================\n')
    return
  }
  for (const [i, err] of errors.entries()) {
    console.error(
      `#${i + 1} [${err.errorCode}] HTTP ${err.httpStatus} ${err.method} ${err.url}`
    )
    console.error(`    message: ${err.message}`)
    if (err.traceId) console.error(`    traceId: ${err.traceId}`)
    if (err.responseBodyPreview) {
      console.error(`    body: ${err.responseBodyPreview}`)
    }
  }
  console.error(`총 ${errors.length}건`)
  console.error('========================================\n')
}

type StoreFile = {
  version: 1
  items: Array<Record<string, unknown>>
}

const STORE_MAX = 200

/** Vite Mock API 와 동일한 디스크 스토어 — /e2e-error-log 페이지가 읽음 */
function persistCapturedToSharedStore(
  captured: CapturedApiError[],
  testTitle: string
): string {
  const outDir = path.join(process.cwd(), 'test-results')
  const storeFile = path.join(outDir, 'e2e-error-log-store.json')
  fs.mkdirSync(outDir, { recursive: true })

  let store: StoreFile = { version: 1, items: [] }
  try {
    if (fs.existsSync(storeFile)) {
      const parsed = JSON.parse(fs.readFileSync(storeFile, 'utf8')) as StoreFile
      if (parsed?.version === 1 && Array.isArray(parsed.items)) store = parsed
    }
  } catch {
    store = { version: 1, items: [] }
  }

  for (const err of captured) {
    let requestPath = err.url
    try {
      const u = new URL(err.url)
      requestPath = `${u.pathname}${u.search}`
    } catch {
      // keep
    }
    const entry = {
      id: `pw-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      occurredAt: err.occurredAt,
      situation: `Playwright · ${testTitle}`,
      route: '',
      method: err.method,
      requestPath,
      httpStatus: err.httpStatus,
      errorCode: err.errorCode,
      message: err.message,
      traceId: err.traceId,
      responseBodyPreview: err.responseBodyPreview,
    }

    const isDup = store.items.some(existing => {
      // traceId 가 있으면 동일 요청만 중복으로 본다 (재시도·다른 path 는 남김)
      if (entry.traceId && existing.traceId) {
        return existing.traceId === entry.traceId
      }
      return (
        existing.errorCode === entry.errorCode &&
        existing.requestPath === entry.requestPath &&
        existing.method === entry.method &&
        existing.message === entry.message &&
        Math.abs(
          Date.parse(String(existing.occurredAt ?? '')) - Date.parse(entry.occurredAt)
        ) < 2_000
      )
    })
    if (!isDup) store.items.unshift(entry)
  }

  store.items = store.items.slice(0, STORE_MAX)
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8')
  return storeFile
}

function entriesFromAppLocalStorage(raw: unknown): CapturedApiError[] {
  if (!raw || typeof raw !== 'object') return []
  const items = (raw as { items?: unknown }).items
  if (!Array.isArray(items)) return []

  const out: CapturedApiError[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const method = typeof row.method === 'string' ? row.method : 'GET'
    const requestPath = typeof row.requestPath === 'string' ? row.requestPath : ''
    const httpStatus =
      typeof row.httpStatus === 'number'
        ? row.httpStatus
        : Number(row.httpStatus)
    if (!Number.isFinite(httpStatus) || httpStatus < 400) continue
    out.push({
      occurredAt:
        typeof row.occurredAt === 'string' ? row.occurredAt : new Date().toISOString(),
      method,
      url: requestPath.startsWith('http')
        ? requestPath
        : `http://localhost${requestPath || '/'}`,
      httpStatus,
      errorCode: typeof row.errorCode === 'string' ? row.errorCode : 'UNKNOWN',
      message: typeof row.message === 'string' ? row.message : '',
      traceId: typeof row.traceId === 'string' ? row.traceId : undefined,
      responseBodyPreview:
        typeof row.responseBodyPreview === 'string' ? row.responseBodyPreview : undefined,
    })
  }
  return out
}

function pathOfUrl(url: string): string {
  try {
    if (url.startsWith('http')) {
      const u = new URL(url)
      return `${u.pathname}${u.search}`
    }
  } catch {
    // keep
  }
  return url
}

function mergeCaptured(
  network: CapturedApiError[],
  fromApp: CapturedApiError[]
): CapturedApiError[] {
  const merged = [...network]
  for (const err of fromApp) {
    const path = pathOfUrl(err.url)
    const dup = merged.some(existing => {
      if (err.traceId && existing.traceId) return existing.traceId === err.traceId
      return (
        existing.errorCode === err.errorCode &&
        existing.method === err.method &&
        pathOfUrl(existing.url) === path &&
        Math.abs(Date.parse(existing.occurredAt) - Date.parse(err.occurredAt)) < 15_000
      )
    })
    if (!dup) merged.push(err)
  }
  return merged
}

/**
 * 실패·백엔드 에러 수집 시:
 * 1) 터미널에 에러 코드·메시지 출력
 * 2) 리포트 attachment
 * 3) test-results/e2e-error-log-latest.json 파일 저장
 * 4) e2e-error-log-store.json 공유 스토어 저장 (/e2e-error-log 페이지용)
 * 5) DEV Mock API POST (Vite 플러그인 로드된 경우)
 */
export async function dumpE2eErrorLogs(args: {
  page: Page
  testInfo: TestInfo
  captured: CapturedApiError[]
}) {
  const { page, testInfo, captured: networkCaptured } = args

  let appStorageRaw: string | null = null
  try {
    appStorageRaw = await page.evaluate(
      key => window.localStorage.getItem(key),
      E2E_ERROR_LOG_STORAGE_KEY
    )
  } catch {
    appStorageRaw = null
  }

  let appLocalStorage: unknown = null
  if (appStorageRaw) {
    try {
      appLocalStorage = JSON.parse(appStorageRaw)
    } catch {
      appLocalStorage = appStorageRaw
    }
  }

  // axios 인터셉터가 남긴 localStorage 건을 네트워크 캡처와 합침 (누락 보완)
  const captured = mergeCaptured(
    networkCaptured,
    entriesFromAppLocalStorage(appLocalStorage)
  )

  printErrorsToTerminal(
    captured,
    networkCaptured.length === captured.length
      ? 'playwright-network'
      : `playwright-network+app-localStorage (net ${networkCaptured.length} → merged ${captured.length})`
  )

  if (appStorageRaw) {
    console.error('[e2e-error-log] app localStorage 에도 기록 있음 (길이', appStorageRaw.length, ')')
  } else if (captured.length > 0) {
    console.error(
      '[e2e-error-log] app localStorage 비어 있음 — 네트워크 캡처(playwright-network)를 보세요.'
    )
  }

  const payload = {
    test: testInfo.titlePath.join(' › '),
    status: testInfo.status,
    capturedFromNetwork: networkCaptured,
    capturedMerged: captured,
    appLocalStorage,
  }
  const json = JSON.stringify(payload, null, 2)

  await testInfo.attach('e2e-error-log.json', {
    body: json,
    contentType: 'application/json',
  })

  try {
    const outDir = path.join(process.cwd(), 'test-results')
    const outFile = path.join(outDir, 'e2e-error-log-latest.json')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outFile, json, 'utf8')
    console.error(`[e2e-error-log] 파일 저장: ${outFile}`)
  } catch (error) {
    console.error('[e2e-error-log] 파일 저장 실패:', error)
  }

  if (captured.length === 0) return

  try {
    const storeFile = persistCapturedToSharedStore(captured, testInfo.title)
    console.error(
      `[e2e-error-log] 공유 스토어 저장: ${storeFile} → http://localhost:3000/e2e-error-log`
    )
  } catch (error) {
    console.error('[e2e-error-log] 공유 스토어 저장 실패:', error)
  }

  // Vite 플러그인이 떠 있으면 HTTP Mock API에도 동기화
  try {
    const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000'
    const items = captured.map(err => {
      let requestPath = err.url
      try {
        const u = new URL(err.url)
        requestPath = `${u.pathname}${u.search}`
      } catch {
        // keep
      }
      return {
        occurredAt: err.occurredAt,
        situation: `Playwright · ${testInfo.title}`,
        route: '',
        method: err.method,
        requestPath,
        httpStatus: err.httpStatus,
        errorCode: err.errorCode,
        message: err.message,
        traceId: err.traceId,
        responseBodyPreview: err.responseBodyPreview,
      }
    })

    const res = await fetch(new URL('/__dev__/e2e-error-logs', baseURL).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (res.ok) {
      console.error('[e2e-error-log] DEV Mock API 동기화 완료')
    } else {
      console.error(
        `[e2e-error-log] DEV Mock API 응답 HTTP ${res.status} — Vite를 재시작하면 /e2e-error-log 에서 스토어 파일을 읽습니다.`
      )
    }
  } catch (error) {
    console.error(
      '[e2e-error-log] DEV Mock API 연결 실패 — 공유 스토어 파일은 저장됨. Vite 재시작 후 /e2e-error-log 확인:',
      error instanceof Error ? error.message : error
    )
  }

  try {
    await page.goto('/e2e-error-log', { waitUntil: 'domcontentloaded', timeout: 10_000 })
  } catch {
    // ignore
  }
}

/** @deprecated dumpE2eErrorLogs 사용 */
export async function attachE2eErrorLogsFromPage(page: Page, testInfo: TestInfo) {
  await dumpE2eErrorLogs({ page, testInfo, captured: [] })
}
