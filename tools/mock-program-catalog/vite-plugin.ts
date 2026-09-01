/**
 * Vite DEV Mock API — CMS 등록 → Platform mock 로그인 공유 프로그램 카탈로그
 *
 * monorepo root `/.dev-mock/program-catalog.json` 을 CMS(:3000) · Platform(:5173)
 * 양쪽 dev 서버가 공유한다.
 *
 * GET    /__dev__/mock-program-catalog
 * POST   /__dev__/mock-program-catalog  body: { program: CmsProgramLike-ish }
 * DELETE /__dev__/mock-program-catalog
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'
import { MOCK_PROGRAM_CATALOG_API_PATH } from './constants'

export { MOCK_PROGRAM_CATALOG_API_PATH } from './constants'

const MAX_ENTRIES = 200

export type MockProgramCatalogItem = {
  id: string
  [key: string]: unknown
}

type StoreFile = {
  version: 1
  items: MockProgramCatalogItem[]
  updatedAt?: string
}

function storeFilePath(monorepoRoot: string) {
  return path.join(monorepoRoot, '.dev-mock', 'program-catalog.json')
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
  writeStoreFile(file, {
    ...store,
    updatedAt: new Date().toISOString(),
  })
}

function writeStoreFile(file: string, store: StoreFile) {
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8')
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

function isCatalogItem(value: unknown): value is MockProgramCatalogItem {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as MockProgramCatalogItem).id === 'string' &&
    (value as MockProgramCatalogItem).id.trim().length > 0
  )
}

export type MockProgramCatalogPluginOptions = {
  /** monorepo root (jakorea) absolute path */
  monorepoRoot: string
}

export function mockProgramCatalogApiPlugin(
  options: MockProgramCatalogPluginOptions
): Plugin {
  const monorepoRoot = options.monorepoRoot

  return {
    name: 'mock-program-catalog-api',
    configureServer(server) {
      const file = storeFilePath(monorepoRoot)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== MOCK_PROGRAM_CATALOG_API_PATH) {
          next()
          return
        }

        try {
          const method = (req.method ?? 'GET').toUpperCase()

          if (method === 'GET') {
            const store = readStore(file)
            sendJson(res, 200, {
              version: 1,
              items: store.items,
              total: store.items.length,
              updatedAt: store.updatedAt ?? null,
            })
            return
          }

          if (method === 'POST') {
            const body = (await readJsonBody(req)) as {
              program?: unknown
            }
            const program = body.program
            if (!isCatalogItem(program)) {
              sendJson(res, 400, {
                success: false,
                message: 'body.program with non-empty id is required',
              })
              return
            }

            const store = readStore(file)
            const nextItem: MockProgramCatalogItem = {
              ...program,
              id: program.id.trim(),
              publishedAt: new Date().toISOString(),
            }
            const existingIndex = store.items.findIndex(item => item.id === nextItem.id)
            if (existingIndex >= 0) {
              store.items[existingIndex] = nextItem
            } else {
              store.items.unshift(nextItem)
            }
            store.items = store.items.slice(0, MAX_ENTRIES)
            writeStore(file, store)

            sendJson(res, 200, {
              success: true,
              data: nextItem,
              total: store.items.length,
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
