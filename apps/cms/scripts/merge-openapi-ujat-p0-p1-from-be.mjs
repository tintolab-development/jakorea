/**
 * JABACK UJAT P0+P1 계약(봉사자 register 필드, 기관 교재, 포털 생성파일 job GET)을
 * CMS `openapi/backend.openapi.json`에 병합한다.
 * 전체 OpenAPI를 overwrite하지 않는다(인증서 등 CMS subset schema 유지).
 *
 * Usage:
 *   BE_OPENAPI=/path/to/JABACK/openapi/backend.openapi.json node scripts/merge-openapi-ujat-p0-p1-from-be.mjs
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

const PORTAL_JOB_PATH = '/api/portal/me/generated-files/jobs/{jobId}'
const REGISTER_EXTRA_PROPS = [
  'previousUjatTerm',
  'educationRegionCode',
  'applicationType',
  /** GENERAL CMS_PROGRESS_ADD: thirdPartyConsent=AGREE 시 필수. UJAT는 omit 가능 */
  'thirdPartyRecipient',
]
const DETAIL_EXTRA_PROPS = [
  'textbookNameEn',
  'textbookDeliveryStatus',
  'kitCount',
  'bookCount',
  /** UJAT guidance / 성범죄 detail 프로젝션 (Admin organization-application detail) */
  'snackAvailability',
  'sexOffenseCheckRequest',
  'leftoverTextbookDisposal',
  /** parkingInfo description: 성범죄는 sexOffenseCheckRequest 정식 필드 */
  'parkingInfo',
]
const GRADE_BLOCK_EXTRA_PROPS = [
  'textbookName',
  'textbookNameEn',
  'kitCount',
  'bookCount',
  'textbookDeliveryStatus',
]

const ALLOCATION_SSOT_SCHEMAS = [
  'AllocationColumn',
  'AllocationEducationSlot',
  'AllocationCell',
  'VolunteerRow',
  'MemberPortalEducationScheduleItem',
]

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))

fe.paths = fe.paths ?? {}
fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

let pathCount = 0
let schemaCount = 0
let propCount = 0

const beJobPath = be.paths?.[PORTAL_JOB_PATH]
if (beJobPath) {
  fe.paths[PORTAL_JOB_PATH] = beJobPath
  pathCount += 1
} else {
  console.warn(`BE missing path ${PORTAL_JOB_PATH}`)
}

const previousUjat = be.components?.schemas?.VolunteerPreviousUjatTermRequest
if (previousUjat) {
  fe.components.schemas.VolunteerPreviousUjatTermRequest = previousUjat
  schemaCount += 1
} else {
  console.warn('BE missing schema VolunteerPreviousUjatTermRequest')
}

function mergeProps(targetName, sourceSchema, extraKeys, remapRef) {
  const target = fe.components.schemas[targetName]
  const sourceProps = sourceSchema?.properties ?? {}
  if (!target) {
    console.warn(`FE missing schema ${targetName}`)
    return
  }
  target.properties = target.properties ?? {}
  for (const key of extraKeys) {
    if (!sourceProps[key]) continue
    let next = sourceProps[key]
    if (remapRef && next?.$ref) {
      next = { ...next, $ref: remapRef(next.$ref) }
    }
    target.properties[key] = next
    propCount += 1
  }
}

mergeProps(
  'VolunteerParticipantRegisterRequest',
  be.components?.schemas?.VolunteerParticipantRegisterRequest,
  REGISTER_EXTRA_PROPS
)

mergeProps(
  'OrganizationApplicationDetailResponse',
  be.components?.schemas?.OrganizationApplicationDetailResponse,
  DETAIL_EXTRA_PROPS
)

mergeProps(
  'GradeBlock',
  be.components?.schemas?.OrganizationApplicationGradeBlock,
  GRADE_BLOCK_EXTRA_PROPS
)

for (const schemaName of ALLOCATION_SSOT_SCHEMAS) {
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
  `Merged UJAT P0+P1 from BE (${bePath}) → FE backend.openapi.json (${schemaCount} schemas, ${propCount} props, ${pathCount} paths)`
)
