/**
 * BE handoff `JABACK/openapi/backend.openapi.json` (또는 환경변수)에서
 * template-variables path + Notification*Catalog* 스키마를 CMS backend.openapi.json 에 병합.
 * 전체 스펙 교체 금지(다른 도메인 path 유지). invent 없이 BE 정의만 반영.
 *
 * Usage:
 *   BE_OPENAPI=/path/to/JABACK/openapi/backend.openapi.json node scripts/merge-openapi-notification-template-variables-from-be.mjs
 *   # default: ../../backend/JABACK/openapi/backend.openapi.json (모노레포 밖 sibling)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const feBackendPath = join(cmsRoot, 'openapi/backend.openapi.json')

// apps/cms → …/frontend/jakorea → …/arbeiten/backend/JABACK
const defaultBePath = resolve(cmsRoot, '../../../../backend/JABACK/openapi/backend.openapi.json')
const bePath = process.env.BE_OPENAPI
  ? resolve(process.env.BE_OPENAPI)
  : defaultBePath

if (!existsSync(bePath)) {
  console.warn(`BE OpenAPI not found (skip merge): ${bePath}`)
  console.warn('Set BE_OPENAPI=... or place JABACK at ../../../../backend/JABACK relative to apps/cms')
  process.exit(0)
}

const PATH_KEY = '/api/admin/notification-send-batches/template-variables'
const SCHEMA_KEYS = [
  'NotificationCatalogVariableItem',
  'NotificationCatalogCategory',
  'NotificationTemplateVariableCatalogResponse',
]

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))

const bePathOp = be.paths?.[PATH_KEY]
if (!bePathOp?.get) {
  console.error(`BE missing path ${PATH_KEY}`)
  process.exit(1)
}

fe.paths = fe.paths ?? {}
fe.paths[PATH_KEY] = bePathOp

fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

let merged = 0
for (const key of SCHEMA_KEYS) {
  const schema = be.components?.schemas?.[key]
  if (!schema) {
    console.warn(`BE missing schema ${key}`)
    continue
  }
  fe.components.schemas[key] = schema
  merged += 1
}

// Keep legacy CatalogVariableItem / CatalogResponse for other consumers, but align descriptions with BE item when present.
const beItem = be.components?.schemas?.NotificationCatalogVariableItem
if (beItem && fe.components.schemas.CatalogVariableItem) {
  fe.components.schemas.CatalogVariableItem = {
    ...fe.components.schemas.CatalogVariableItem,
    description: beItem.description,
    properties: {
      ...fe.components.schemas.CatalogVariableItem.properties,
      ...beItem.properties,
    },
  }
}

writeFileSync(feBackendPath, `${JSON.stringify(fe, null, 2)}\n`)
console.log(
  `Merged template-variables from BE (${bePath}) → FE backend.openapi.json (${merged} schemas + path)`
)
