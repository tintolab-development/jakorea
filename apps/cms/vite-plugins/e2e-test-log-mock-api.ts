/**
 * Vite DEV Mock API — E2E 테스트 진행 로그 (파일 저장)
 *
 * GET    /__dev__/e2e-test-logs
 * POST   /__dev__/e2e-test-logs
 * DELETE /__dev__/e2e-test-logs
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

const API_PATH = '/__dev__/e2e-test-logs'
const MAX_ENTRIES = 300

type StoreFile = {
  version: 1
  items: Array<Record<string, unknown>>
}

function storePath(root: string) {
  return path.join(root, 'test-results', 'e2e-test-log-store.json')
}

function readStore(file: string): StoreFile {
  try {
    if (!fs.existsSync(file)) return { version: 1, items: [] }
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as StoreFile
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] }
    }
    return parsed
  } catch {
    return { version: 1, items: [] }
  }
}

function writeStore(file: string, store: StoreFile) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8')
}

function buildByStatus(items: Array<Record<string, unknown>>) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = String(item.status ?? '(unknown)')
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function buildSummary(items: Array<Record<string, unknown>>) {
  const terminal = items.filter(i =>
    ['passed', 'failed', 'skipped', 'timedOut', 'interrupted'].includes(String(i.status))
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
    const metrics =
      item.metrics && typeof item.metrics === 'object'
        ? (item.metrics as Record<string, unknown>)
        : {}
    apiCallTotal += typeof metrics.apiOkCount === 'number' ? metrics.apiOkCount : 0
    apiCallTotal += typeof metrics.apiErrorCount === 'number' ? metrics.apiErrorCount : 0
    mutationTotal += typeof metrics.mutationCount === 'number' ? metrics.mutationCount : 0
    if (
      item.status === 'api' &&
      typeof item.method === 'string' &&
      /^(POST|PUT|PATCH|DELETE)$/i.test(item.method)
    ) {
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

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `e2e-test-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: Connect.ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(json)
}

function normalizeEntry(input: Record<string, unknown>) {
  const titlePath = Array.isArray(input.titlePath)
    ? input.titlePath.map(String)
    : typeof input.title === 'string'
      ? [input.title]
      : ['(unknown)']
  return {
    id: typeof input.id === 'string' ? input.id : newId(),
    occurredAt:
      typeof input.occurredAt === 'string' ? input.occurredAt : new Date().toISOString(),
    status: String(input.status ?? 'api'),
    title: String(input.title ?? titlePath.join(' › ')),
    titlePath,
    file: typeof input.file === 'string' ? input.file : undefined,
    project: typeof input.project === 'string' ? input.project : undefined,
    retry: typeof input.retry === 'number' ? input.retry : undefined,
    durationMs: typeof input.durationMs === 'number' ? input.durationMs : undefined,
    phase: typeof input.phase === 'string' ? input.phase : undefined,
    method: typeof input.method === 'string' ? input.method : undefined,
    requestPath: typeof input.requestPath === 'string' ? input.requestPath : undefined,
    httpStatus: typeof input.httpStatus === 'number' ? input.httpStatus : null,
    requestPayload:
      typeof input.requestPayload === 'string' ? input.requestPayload : undefined,
    responsePreview:
      typeof input.responsePreview === 'string' ? input.responsePreview : undefined,
    metrics:
      input.metrics && typeof input.metrics === 'object'
        ? (input.metrics as Record<string, unknown>)
        : undefined,
    message: typeof input.message === 'string' ? input.message : undefined,
    errorMessage: typeof input.errorMessage === 'string' ? input.errorMessage : undefined,
  }
}

export function e2eTestLogMockApiPlugin(): Plugin {
  return {
    name: 'cms-e2e-test-log-mock-api',
    configureServer(server) {
      const file = storePath(server.config.root)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== API_PATH) {
          next()
          return
        }

        try {
          const method = (req.method ?? 'GET').toUpperCase()

          if (method === 'GET') {
            const store = readStore(file)
            const items = [...store.items].sort((a, b) => {
              const aAt = String(a.occurredAt ?? '')
              const bAt = String(b.occurredAt ?? '')
              return aAt < bAt ? 1 : aAt > bAt ? -1 : 0
            })
            sendJson(res, 200, {
              success: true,
              data: {
                items,
                total: items.length,
                byStatus: buildByStatus(items),
                summary: buildSummary(items),
              },
            })
            return
          }

          if (method === 'POST') {
            const body = (await readJsonBody(req)) as Record<string, unknown>
            const bulk = Array.isArray(body.items) ? body.items : null
            const inputs = bulk ?? [body]
            const store = readStore(file)
            const created: Array<Record<string, unknown>> = []

            for (const raw of inputs) {
              if (!raw || typeof raw !== 'object') continue
              const entry = normalizeEntry(raw as Record<string, unknown>)
              created.push(entry)
              store.items.unshift(entry)
            }

            store.items = store.items.slice(0, MAX_ENTRIES)
            writeStore(file, store)

            sendJson(res, 200, {
              success: true,
              data: bulk ? { items: created, total: created.length } : created[0] ?? null,
            })
            return
          }

          if (method === 'DELETE') {
            const store = readStore(file)
            const cleared = store.items.length
            writeStore(file, { version: 1, items: [] })
            sendJson(res, 200, { success: true, data: { cleared } })
            return
          }

          sendJson(res, 405, { success: false, message: 'Method Not Allowed' })
        } catch (error) {
          sendJson(res, 500, {
            success: false,
            message: error instanceof Error ? error.message : String(error),
          })
        }
      })
    },
  }
}

export const E2E_TEST_LOG_MOCK_API_PATH = API_PATH
