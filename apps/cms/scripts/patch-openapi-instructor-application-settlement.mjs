/**
 * 강사 신청 상세 settlement OpenAPI 반영 (BE 계약 선반영).
 *
 * - InstructorApplicationDetailResponse.settlement: InstructorCmsSettlement | null
 * - InstructorCmsSettlement 루트 필드 nullable (NON_NULL 직렬화로 생략될 수도 있음)
 *
 * backend 스냅샷과 이미 필터된 스펙 모두에 적용한다. 멱등.
 *   node scripts/patch-openapi-instructor-application-settlement.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')

const SPEC_FILES = [
  'backend.openapi.json',
  'dashboard.openapi.json',
  'data-management.openapi.json',
  'posts.openapi.json',
  'settlement.openapi.json',
  'members.openapi.json',
  'forms-surveys.openapi.json',
]

const settlementProperty = {
  description:
    '강사 현재 정산 정보(member_bank_account.is_current=true). 회원 상세 InstructorCmsSettlement와 같은 구조이며 bankAccounts는 사용하지 않는다. 일반 상세는 계좌번호·예금주 마스킹, 개인정보 원문 조회에서만 원문. 없으면 null',
  oneOf: [{ $ref: '#/components/schemas/InstructorCmsSettlement' }, { type: 'null' }],
}

const businessIncomeEarnerStatusProperty = {
  type: 'string',
  nullable: true,
  description:
    '사업소득자 해당 여부. 해당 | 해당 없음. 신청 컬럼 우선, 없으면 instructor_profile.business_income_yn(true→해당, false→해당 없음). 둘 다 없으면 null',
}

const NULLABLE_SETTLEMENT_FIELDS = ['bankName', 'accountNumber', 'accountHolder', 'businessIncome']

function patchSpec(spec) {
  const schemas = spec.components?.schemas
  const detail = schemas?.InstructorApplicationDetailResponse
  if (!detail?.properties) return false

  const props = detail.properties
  const next = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'settlement') continue
    if (key === 'businessIncomeEarnerStatus') {
      next.settlement = settlementProperty
      next.businessIncomeEarnerStatus = businessIncomeEarnerStatusProperty
      continue
    }
    next[key] = value
  }
  if (!next.settlement) next.settlement = settlementProperty
  detail.properties = next

  const settlement = schemas.InstructorCmsSettlement
  if (settlement?.properties) {
    for (const field of NULLABLE_SETTLEMENT_FIELDS) {
      const prop = settlement.properties[field]
      if (prop) prop.nullable = true
    }
  }
  return true
}

for (const file of SPEC_FILES) {
  const path = join(openapiDir, file)
  if (!existsSync(path)) continue
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  if (!patchSpec(spec)) continue
  const indent = raw.startsWith('{\n  "') ? 2 : raw.startsWith('{\n    "') ? 4 : 2
  writeFileSync(path, `${JSON.stringify(spec, null, indent)}\n`)
  console.log(`patched ${file}`)
}
