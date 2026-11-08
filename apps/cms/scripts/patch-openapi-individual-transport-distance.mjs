/**
 * 개인형 참가자(학생) 교통비 편도 30km 서버 판단 OpenAPI 반영 (BE `keonhee` 계약 선반영).
 *
 * - IndividualSettlementTransportPreview: 회차별 편도 km·지급 가능 여부·불가 사유
 * - IndividualSettlementSchedule.transportPreview
 * - IndividualSettlementItem / IndividualSettlementReviewItem.oneWayDistanceKm (제출 시점 스냅샷)
 *
 * FE는 거리를 계산하지 않는다. 신청란 노출은 payableItems, 안내는 transportPreview만 따른다.
 * backend 스냅샷과 이미 필터된 스펙 모두에 적용한다. 멱등.
 *   node scripts/patch-openapi-individual-transport-distance.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')

const transportPreviewSchema = {
  type: 'object',
  properties: {
    oneWayDistanceKm: {
      type: 'number',
      format: 'double',
      nullable: true,
      description: '편도 km. 소수 허용. 주소 없음·산출 불가면 null. 0으로 채우지 않는다.',
      example: 35.0,
    },
    eligible: {
      type: 'boolean',
      description:
        '학생 교통비 신청 가능 여부. 편도 최소 거리(기본 30.0km 포함) 이상이고 거리를 산출했을 때만 true.',
    },
    ineligibleReason: {
      type: 'string',
      nullable: true,
      enum: ['UNDER_MIN_DISTANCE', 'ADDRESS_MISSING'],
      description:
        '불가 사유. eligible=true이면 null. UNDER_MIN_DISTANCE=편도 최소 거리 미만. ADDRESS_MISSING=자택/장소 없음 또는 거리 산출 불가.',
    },
  },
  required: ['eligible'],
}

const transportPreviewProperty = {
  $ref: '#/components/schemas/IndividualSettlementTransportPreview',
  nullable: true,
  description:
    '회차별 학생 교통비 편도 거리 안내. FE는 이 값만 표시하고 거리를 계산하지 않는다. 산출 불가면 oneWayDistanceKm=null, eligible=false.',
}

const oneWayDistanceProperty = target => ({
  type: 'number',
  format: 'double',
  nullable: true,
  description: `제출 시점 편도 km 스냅샷. 기존 건은 null. ${target} 이 값만 사용하고 거리를 다시 계산하지 않는다.`,
})

for (const file of readdirSync(openapiDir).filter(name => name.endsWith('.openapi.json'))) {
  const path = join(openapiDir, file)
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  const schemas = spec.components?.schemas
  if (!schemas) continue
  let changed = false

  const scheduleProps = schemas.IndividualSettlementSchedule?.properties
  if (scheduleProps) {
    schemas.IndividualSettlementTransportPreview = transportPreviewSchema
    scheduleProps.transportPreview = transportPreviewProperty
    changed = true
  }
  if (schemas.IndividualSettlementItem?.properties) {
    schemas.IndividualSettlementItem.properties.oneWayDistanceKm =
      oneWayDistanceProperty('문서/심사는')
    changed = true
  }
  if (schemas.IndividualSettlementReviewItem?.properties) {
    schemas.IndividualSettlementReviewItem.properties.oneWayDistanceKm =
      oneWayDistanceProperty('심사 화면은')
    changed = true
  }

  if (!changed) continue
  const indent = raw.startsWith('{\n    "') ? 4 : 2
  writeFileSync(path, `${JSON.stringify(spec, null, indent)}\n`)
  console.log(`patched ${file}`)
}
