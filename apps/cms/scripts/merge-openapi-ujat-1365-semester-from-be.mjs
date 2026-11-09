/**
 * JABACK UJAT 1365 봉사시간 등록 양식 — 반기 일괄 API(operationId ujat1365SemesterRegistrationForm)를
 * CMS `openapi/backend.openapi.json`에 병합한다. 해당 path와 `Ujat1365Semester*` schema만 덮어쓴다.
 *
 * Usage:
 *   BE_OPENAPI=/path/to/JABACK/openapi/backend.openapi.json node scripts/merge-openapi-ujat-1365-semester-from-be.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const feBackendPath = join(cmsRoot, 'openapi/backend.openapi.json')
const candidateBePaths = [
  process.env.BE_OPENAPI ? resolve(process.env.BE_OPENAPI) : null,
  resolve(cmsRoot, '../../../backend/JABACK/openapi/backend.openapi.json'),
  resolve(cmsRoot, '../../../../backend/JABACK/openapi/backend.openapi.json'),
].filter(Boolean)

const bePath = candidateBePaths.find(path => existsSync(path))
if (!bePath) {
  console.warn(`BE OpenAPI not found (skip merge): ${candidateBePaths.join(' | ')}`)
  process.exit(0)
}

const UJAT_1365_SEMESTER_PATH = '/api/admin/programs/{programId}/ujat/1365-registration-form'
const UJAT_1365_SEMESTER_SCHEMAS = [
  'Ujat1365SemesterRegistrationFormRequest',
  'Ujat1365SemesterRegistrationFormResponse',
  'Ujat1365SemesterRegistrationFormColumns',
  'Ujat1365SemesterRegistrationFormColumn',
  'Ujat1365SemesterRegistrationFormVolunteer',
  'Ujat1365SemesterRegistrationFormCell',
]

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))
fe.paths = fe.paths ?? {}
fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

const bePathItem = be.paths?.[UJAT_1365_SEMESTER_PATH]
if (!bePathItem) {
  console.warn(`BE missing path ${UJAT_1365_SEMESTER_PATH} (skip merge)`)
  process.exit(0)
}
fe.paths[UJAT_1365_SEMESTER_PATH] = bePathItem

let schemaCount = 0
for (const schemaName of UJAT_1365_SEMESTER_SCHEMAS) {
  const source = be.components?.schemas?.[schemaName]
  if (!source) {
    console.warn(`BE missing schema ${schemaName}`)
    continue
  }
  fe.components.schemas[schemaName] = source
  schemaCount += 1
}

writeFileSync(feBackendPath, `${JSON.stringify(fe, null, 2)}\n`)
console.log(
  `Merged UJAT 1365 semester form from BE (${bePath}) → FE backend.openapi.json (${schemaCount} schemas, 1 path)`
)
