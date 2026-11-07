/**
 * 정산 산출 항목 description 서버 계약 + 개인 정산 tripType OpenAPI 반영 (BE 계약 선반영).
 *
 * - SettlementFrontendItemResponse / Line / SettlementApplicationDocumentLine /
 *   IndividualSettlementReviewItem / IndividualSettlementItem: description nullable (서버 제출 시점 생성·저장값)
 * - IndividualSettlementItemInput / IndividualSettlementItem: tripType ROUND_TRIP | ONE_WAY | null
 *
 * backend 스냅샷과 이미 필터된 스펙 모두에 적용한다. 멱등.
 *   node scripts/patch-openapi-settlement-item-description.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')

const DESCRIPTION_SCHEMAS = [
  'SettlementFrontendItemResponse',
  'Line',
  'SettlementApplicationDocumentLine',
  'IndividualSettlementReviewItem',
  'IndividualSettlementItem',
]

const descriptionProperty = {
  type: 'string',
  nullable: true,
  description:
    '산출 항목 설명. 백엔드가 정산 제출 시점에 생성·저장한 값이며 이후 설정 변경에도 바뀌지 않는다. FE는 그대로 표시하고 조립·재생성하지 않는다. 없으면 null.',
}

const tripTypeProperty = {
  type: 'string',
  nullable: true,
  enum: ['ROUND_TRIP', 'ONE_WAY'],
  description:
    '학생 교통비 왕복/편도. ROUND_TRIP → 왕복 교통비 실비 지급, ONE_WAY → 편도 교통비 실비 지급. null·생략이면 서버 description null.',
}

const TRIP_TYPE_SCHEMAS = ['IndividualSettlementItemInput', 'IndividualSettlementItem']

for (const file of readdirSync(openapiDir).filter(name => name.endsWith('.openapi.json'))) {
  const path = join(openapiDir, file)
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  const schemas = spec.components?.schemas
  if (!schemas) continue
  let changed = false

  for (const name of DESCRIPTION_SCHEMAS) {
    const props = schemas[name]?.properties
    if (!props?.description) continue
    props.description = { ...props.description, ...descriptionProperty }
    changed = true
  }
  for (const name of TRIP_TYPE_SCHEMAS) {
    const props = schemas[name]?.properties
    if (!props) continue
    props.tripType = tripTypeProperty
    changed = true
  }

  if (!changed) continue
  const indent = raw.startsWith('{\n    "') ? 4 : 2
  writeFileSync(path, `${JSON.stringify(spec, null, indent)}\n`)
  console.log(`patched ${file}`)
}
