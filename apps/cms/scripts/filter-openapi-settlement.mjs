/**
 * 정산 관리 API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/settlement.openapi.json`
 *
 * BE `/v3/api-docs`가 아직 반영 전일 수 있는 계좌 지급 P0 계약
 * (`AccountPaymentListItemResponse` extras · list query · detail.settlement = SettlementFrontendResponse)
 * 을 FE codegen용으로 보강한다. 원본 스펙에 동일 필드가 있으면 덮어쓰지 않는다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/settlement.openapi.json')

const SETTLEMENT_PATH_PREFIXES = [
  '/api/admin/settlements',
  '/api/admin/account-payments',
  '/api/admin/settlement-configs',
]

const ACCOUNT_PAYMENT_LIST_EXTRA_PROPERTIES = {
  programNameKo: {
    type: 'string',
    description: '프로그램명(한글). 계좌 지급 확인 목록 컬럼.',
  },
  programName: {
    type: 'string',
    description: '프로그램명(호환). programNameKo 우선.',
  },
  institutionName: {
    type: 'string',
    nullable: true,
    description: '참여 기관명. 개인 프로그램은 null → UI `-`.',
  },
  sessionOrdinal: {
    type: 'integer',
    format: 'int32',
    nullable: true,
    description: '강의 진행 차시 번호. sessionLabel이 있으면 라벨 우선.',
  },
  sessionLabel: {
    type: 'string',
    nullable: true,
    description: '강의 진행 차시 표시. 예: `2 ~ 3차시`. 개인 프로그램은 null → UI `-`.',
  },
  lectureDate: {
    type: 'string',
    format: 'date',
    nullable: true,
    description: '출강일. 캘린더 배치 기준.',
  },
}

const ACCOUNT_PAYMENT_LIST_QUERY_PARAMS = [
  {
    name: 'fromDate',
    in: 'query',
    required: false,
    schema: { type: 'string', format: 'date' },
    description: '이체 예정일(scheduledPaymentDate) 구간 시작. 출강일 아님.',
  },
  {
    name: 'toDate',
    in: 'query',
    required: false,
    schema: { type: 'string', format: 'date' },
    description: '이체 예정일(scheduledPaymentDate) 구간 끝.',
  },
  {
    name: 'instructorName',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: '신청자명 contains 검색.',
  },
  {
    name: 'programName',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: '프로그램명 contains 검색.',
  },
  {
    name: 'year',
    in: 'query',
    required: false,
    schema: { type: 'integer', format: 'int32' },
    description:
      '이체일 기준 전년-12-01 ~ 당해-12-31. fromDate/toDate가 있으면 그 값 우선.',
  },
]

function ensureObject(target, key) {
  if (!target[key] || typeof target[key] !== 'object') {
    target[key] = {}
  }
  return target[key]
}

function patchAccountPaymentP0Contract(subset) {
  const schemas = ensureObject(ensureObject(subset, 'components'), 'schemas')

  const listItem = schemas.AccountPaymentListItemResponse
  if (listItem?.type === 'object') {
    listItem.properties = { ...(listItem.properties ?? {}) }
    for (const [key, schema] of Object.entries(ACCOUNT_PAYMENT_LIST_EXTRA_PROPERTIES)) {
      if (listItem.properties[key] == null) {
        listItem.properties[key] = schema
      }
    }
  }

  const detail = schemas.AccountPaymentDetailResponse
  if (detail?.type === 'object' && schemas.SettlementFrontendResponse) {
    detail.properties = { ...(detail.properties ?? {}) }
    const settlementProp = detail.properties.settlement
    const ref = settlementProp?.$ref ?? ''
    if (!ref.includes('SettlementFrontendResponse')) {
      detail.properties.settlement = {
        $ref: '#/components/schemas/SettlementFrontendResponse',
        description:
          '정산 상세와 동일 계약(SettlementFrontendResponse). Gemini 등 정산 없는 건은 null.',
      }
    }
  }

  const listPath = subset.paths?.['/api/admin/account-payments']?.get
  if (listPath) {
    const existing = new Set((listPath.parameters ?? []).map(p => p.name))
    listPath.parameters = [
      ...(listPath.parameters ?? []),
      ...ACCOUNT_PAYMENT_LIST_QUERY_PARAMS.filter(p => !existing.has(p.name)),
    ]
  }
}

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) =>
    SETTLEMENT_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
  )
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Settlement subset`,
    description: 'Filtered for CMS settlement management Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

patchAccountPaymentP0Contract(subset)

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
const pathCount = Object.keys(filteredPaths).length
if (pathCount === 0) {
  throw new Error(`No paths matched SETTLEMENT_PATH_PREFIXES in ${inputPath}`)
}
console.log(`Wrote ${outputPath} (${pathCount} paths)`)
