/**
 * Vite DEV Mock API — E2E 백엔드 에러 로그 (파일 저장)
 *
 * Playwright / 일반 브라우저가 같은 디스크 스토어를 공유하므로
 * `/e2e-error-log` 페이지에서 E2E 중 발생한 DATABASE_ERROR 등을 볼 수 있습니다.
 *
 * GET    /__dev__/e2e-error-logs
 * POST   /__dev__/e2e-error-logs
 * DELETE /__dev__/e2e-error-logs
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

const API_PATH = '/__dev__/e2e-error-logs'
const MAX_ENTRIES = 200

type StoreFile = {
  version: 1
  items: Array<Record<string, unknown>>
}

function storePath(root: string) {
  return path.join(root, 'test-results', 'e2e-error-log-store.json')
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

function buildByErrorCode(items: Array<Record<string, unknown>>) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const code = String(item.errorCode ?? '(unknown)')
    counts[code] = (counts[code] ?? 0) + 1
  }
  return counts
}

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `e2e-err-${Date.now()}-${Math.random().toString(16).slice(2)}`
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

export function e2eErrorLogMockApiPlugin(): Plugin {
  return {
    name: 'cms-e2e-error-log-mock-api',
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
                byErrorCode: buildByErrorCode(items),
              },
            })
            return
          }

          if (method === 'POST') {
            const body = (await readJsonBody(req)) as Record<string, unknown>
            // bulk: { items: [...] }
            const bulk = Array.isArray(body.items) ? body.items : null
            const inputs = bulk ?? [body]
            const store = readStore(file)
            const created: Array<Record<string, unknown>> = []

            for (const input of inputs) {
              if (!input || typeof input !== 'object') continue
              const entry = {
                id: typeof input.id === 'string' ? input.id : newId(),
                occurredAt:
                  typeof input.occurredAt === 'string'
                    ? input.occurredAt
                    : new Date().toISOString(),
                situation: String(input.situation ?? '(unknown)'),
                route: String(input.route ?? ''),
                method: String(input.method ?? 'GET'),
                requestPath: String(input.requestPath ?? ''),
                httpStatus:
                  typeof input.httpStatus === 'number' ? input.httpStatus : null,
                errorCode: String(input.errorCode ?? 'UNKNOWN'),
                message: String(input.message ?? ''),
                traceId: typeof input.traceId === 'string' ? input.traceId : undefined,
                requestBodyPreview:
                  typeof input.requestBodyPreview === 'string'
                    ? input.requestBodyPreview
                    : undefined,
                responseBodyPreview:
                  typeof input.responseBodyPreview === 'string'
                    ? input.responseBodyPreview
                    : undefined,
              }

              const isDup = store.items.some(existing => {
                if (entry.traceId && existing.traceId) {
                  return existing.traceId === entry.traceId
                }
                if (
                  existing.errorCode === entry.errorCode &&
                  existing.requestPath === entry.requestPath &&
                  existing.method === entry.method &&
                  existing.message === entry.message
                ) {
                  const a = Date.parse(String(existing.occurredAt ?? ''))
                  const b = Date.parse(String(entry.occurredAt ?? ''))
                  if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 2_000) {
                    return true
                  }
                }
                return false
              })
              if (isDup) continue

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

export const E2E_ERROR_LOG_MOCK_API_PATH = API_PATH
