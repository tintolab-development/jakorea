/**
 * 관리자 확정 전 정산 신청서 지급조서 조회 OpenAPI 반영 (BE 계약 선반영).
 *
 * - GET /api/admin/settlement-applications/{applicationId}/application-document (revisionNo 선택)
 * - CalcInfo / SettlementApplicationDocumentCalcInfo: instructorFeeCalculationUnit, educationStartAt,
 *   educationEndAt, recognizedSessionCount (nullable)
 * - BasicInfo 스냅샷 필드 nullable (제출 스냅샷에 없으면 null)
 *
 * settlement 필터가 /api/admin/settlements* 만 남기므로 filter 이후에도 실행한다. 멱등.
 *   node scripts/patch-openapi-settlement-application-document-admin.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')
const SPEC_FILES = ['backend.openapi.json', 'settlement.openapi.json']

const ADMIN_DOCUMENT_PATH = '/api/admin/settlement-applications/{applicationId}/application-document'

const adminDocumentOperation = {
  get: {
    tags: ['기타 API'],
    operationId: 'getAdminSettlementApplicationDocument',
    summary: '관리자 확정 전 정산 신청서 지급조서 조회',
    description:
      '정산 목록 행에 settlementId가 없고 settlementApplicationId가 있을 때 사용한다. 제출 revision 스냅샷만 반환하며 현재 회원·일정·프로필로 보완하지 않는다. 권한: 관리자 인증 + SETTLEMENT_READ.',
    parameters: [
      {
        name: 'applicationId',
        in: 'path',
        required: true,
        description: '정산 목록 응답의 settlementApplicationId',
        schema: { type: 'integer', format: 'int64' },
      },
      {
        name: 'revisionNo',
        in: 'query',
        required: false,
        description: '조회할 revision. 생략하면 최신 revision',
        schema: { type: 'integer', format: 'int32' },
      },
    ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponseSettlementApplicationDocumentResponse' },
          },
        },
      },
      400: { description: '잘못된 revisionNo' },
      401: { description: '인증 만료' },
      403: { description: '권한 또는 프로그램 접근 범위 부족' },
      404: { description: '정산 신청서 또는 revision 없음' },
    },
  },
}

const calcInfoExtraProperties = {
  instructorFeeCalculationUnit: {
    type: 'string',
    nullable: true,
    enum: ['PER_HOUR', 'PER_CLASS', 'PER_SESSION', 'PER_LECTURE'],
    description:
      '강사비 책정 단위. 제출 시점 lectureFeePreview.instructorFeeCalculationUnit과 동일 코드. 구 스냅샷에 없으면 null',
  },
  recognizedSessionCount: {
    type: 'integer',
    nullable: true,
    description:
      "강사비 산정에 적용된 인정 차시. 지급조서 '교육 진행 차시' 표시 기준. 구 스냅샷에 없으면 null이며 educationSessionCount로 대체하지 않는다.",
  },
  educationStartAt: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: '제출 시점 program_schedule.start_at (ISO-8601 instant). 구 스냅샷에 없으면 null',
  },
  educationEndAt: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: '제출 시점 program_schedule.end_at (ISO-8601 instant). 구 스냅샷에 없으면 null',
  },
}

function patchCalcInfo(schema) {
  if (!schema?.properties) return
  for (const [key, value] of Object.entries(calcInfoExtraProperties)) {
    if (!schema.properties[key]) schema.properties[key] = value
    else schema.properties[key] = { ...schema.properties[key], ...value }
  }
}

function patchBasicInfo(schema) {
  if (!schema?.properties) return
  for (const prop of Object.values(schema.properties)) {
    if (prop && typeof prop === 'object' && !prop.$ref) prop.nullable = true
  }
}

for (const file of SPEC_FILES) {
  const path = join(openapiDir, file)
  if (!existsSync(path)) continue
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  const schemas = spec.components?.schemas ?? {}
  if (!schemas.SettlementApplicationDocumentResponse) continue

  spec.paths[ADMIN_DOCUMENT_PATH] = adminDocumentOperation
  patchCalcInfo(schemas.CalcInfo)
  patchCalcInfo(schemas.SettlementApplicationDocumentCalcInfo)
  patchBasicInfo(schemas.BasicInfo)
  patchBasicInfo(schemas.SettlementApplicationDocumentBasicInfo)

  const indent = raw.startsWith('{\n    "') ? 4 : 2
  writeFileSync(path, `${JSON.stringify(spec, null, indent)}\n`)
  console.log(`patched ${file}`)
}
