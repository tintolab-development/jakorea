/**
 * 지급조서 확인·계좌 지급 확인을 정산 대상자 전체(강사·참여자·봉사자)로 넓힌 BE 계약 반영 (BE 계약 선반영).
 *
 * - 쿼리 payeeType (INSTRUCTOR | PARTICIPANT | VOLUNTEER, 생략=전체):
 *   GET /api/admin/settlements, /settlements/aggregates, /settlements/calendar, /account-payments
 * - SettlementListItemResponse: payeeType, individualSettlementApplicationId, rowType 값 INDIVIDUAL_SETTLEMENT_APPLICATION
 * - SettlementCalendarItemResponse: rowType, payeeType, settlementApplicationId, individualSettlementApplicationId
 * - SettlementListItemResponse: payeeBankName·payeeAccountNumberMasked·payeeAccountHolder(영수증 행 신청 당시 계좌)
 * - SettlementBulkStatusChangeRequest: individualSettlementApplications(IndividualSettlementBulkApprovalTarget) — 영수증 일괄 승인
 * - SettlementBulkStatusChangeRequest: instructorSettlementApplications(InstructorSettlementBulkConfirmTarget) — 확정 전 강사 신청서 일괄 확인
 * - SettlementBulkStatusChangeResponse: instructorSettlementApplicationResults(SettlementApplicationAdminActionResponse[])
 *
 * backend 스냅샷과 이미 필터된 스펙 모두에 적용한다. 멱등.
 *   node scripts/patch-openapi-settlement-all-payees.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')

const PAYEE_TYPE_ENUM = ['INSTRUCTOR', 'PARTICIPANT', 'VOLUNTEER']

const payeeTypeParameter = {
  name: 'payeeType',
  in: 'query',
  required: false,
  description:
    '정산 대상자 구분. INSTRUCTOR=강사(Gemini 포함), PARTICIPANT=개인 참여자 영수증, VOLUNTEER=봉사자 영수증. 생략하면 전체',
  schema: { type: 'string', enum: PAYEE_TYPE_ENUM },
}

const PAYEE_TYPE_QUERY_OPERATIONS = [
  '/api/admin/settlements',
  '/api/admin/settlements/aggregates',
  '/api/admin/settlements/calendar',
  '/api/admin/account-payments',
]

const LIST_ROW_TYPE_ENUM = [
  'SETTLEMENT',
  'SETTLEMENT_APPLICATION',
  'INDIVIDUAL_SETTLEMENT_APPLICATION',
  'NOT_APPLIED',
]

const listItemProperties = {
  payeeType: {
    type: 'string',
    enum: PAYEE_TYPE_ENUM,
    description:
      '정산 대상자 구분. INSTRUCTOR=강사(Gemini 실적 포함), PARTICIPANT=개인 참여자 영수증, VOLUNTEER=봉사자 영수증. 계좌 지급 목록의 payeeType과 같은 규칙.',
  },
  individualSettlementApplicationId: {
    type: 'integer',
    format: 'int64',
    nullable: true,
    description:
      '영수증 정산 신청 ID. rowType=INDIVIDUAL_SETTLEMENT_APPLICATION 행만 값이 있다. 상세·승인·반려는 /api/admin/individual-settlement-applications/{id} 계열. 이 행은 settlementId·statementId·settlementApplicationId·instructorAssignmentId가 null이고 instructorMemberId·instructorName에 신청 회원 ID·이름이 들어간다.',
  },
  payeeBankName: {
    type: 'string',
    nullable: true,
    description:
      '영수증 정산 신청 행의 정산 계좌 은행명. 신청 당시 사전 동의서 계좌 스냅샷(지급조서 사전 동의서가 있으면 그 계좌, 없으면 영수증 사전 동의서 계좌)이며 신청 뒤 계좌를 바꿔도 그대로다. 강사 행과 스냅샷에 계좌가 없는 신청은 null.',
  },
  payeeAccountNumberMasked: {
    type: 'string',
    nullable: true,
    description:
      '영수증 정산 신청 행의 정산 계좌번호(마스킹). 강사 정산 상세 accountNumber와 같은 마스킹 규칙. 강사 행과 스냅샷에 계좌가 없는 신청은 null.',
  },
  payeeAccountHolder: {
    type: 'string',
    nullable: true,
    description:
      '영수증 정산 신청 행의 예금주(마스킹). 강사 정산 상세 accountHolder와 같은 마스킹 규칙. 강사 행과 스냅샷에 계좌가 없는 신청은 null.',
  },
}

const listRowTypeDescription =
  'SETTLEMENT=지급조서(정산) 행, SETTLEMENT_APPLICATION=확정 전 정산 신청서 행, INDIVIDUAL_SETTLEMENT_APPLICATION=개인 참여자·봉사자 영수증 정산 신청 행(지급조서 확인 목록만), NOT_APPLIED=정산 신청 전인 배정 교육·사전교육 일정 행. 지급조서 확인 목록의 정산 행과 회원 상세 정산 탭에서는 null.'

const calendarItemProperties = {
  rowType: {
    type: 'string',
    nullable: true,
    enum: ['SETTLEMENT', 'SETTLEMENT_APPLICATION', 'INDIVIDUAL_SETTLEMENT_APPLICATION'],
    description:
      'SETTLEMENT=지급조서, SETTLEMENT_APPLICATION=확정 전 강사 정산 신청서, INDIVIDUAL_SETTLEMENT_APPLICATION=영수증 정산 신청. 신청 행은 settlementId가 null.',
  },
  payeeType: {
    type: 'string',
    nullable: true,
    enum: PAYEE_TYPE_ENUM,
    description: '정산 대상자 구분: INSTRUCTOR | PARTICIPANT | VOLUNTEER.',
  },
  settlementApplicationId: {
    type: 'integer',
    format: 'int64',
    nullable: true,
    description: 'rowType=SETTLEMENT_APPLICATION 행의 강사 정산 신청서 ID. 그 외 null.',
  },
  individualSettlementApplicationId: {
    type: 'integer',
    format: 'int64',
    nullable: true,
    description: 'rowType=INDIVIDUAL_SETTLEMENT_APPLICATION 행의 영수증 정산 신청 ID. 그 외 null.',
  },
}

/** 지급조서 일괄 확인에 영수증 승인 대상을 함께 보낸다(한 트랜잭션, 전체 성공 또는 전체 롤백) */
const individualSettlementBulkApprovalTarget = {
  type: 'object',
  required: ['settlementApplicationId', 'expectedRevisionNo'],
  description:
    '영수증 정산 신청 일괄 승인 대상. expectedRevisionNo는 단건 승인과 같은 낙관적 잠금 값(지급조서 확인 라인의 revisionNo).',
  properties: {
    settlementApplicationId: {
      type: 'integer',
      format: 'int64',
      minimum: 1,
      description: '영수증 정산 신청 ID. 지급조서 확인 라인의 individualSettlementApplicationId',
    },
    expectedRevisionNo: {
      type: 'integer',
      format: 'int32',
      minimum: 1,
      description: '확인할 최신 revision 번호',
    },
  },
}

const bulkIndividualSettlementApplicationsProperty = {
  type: 'array',
  maxItems: 500,
  items: { $ref: '#/components/schemas/IndividualSettlementBulkApprovalTarget' },
  description:
    '지급조서 일괄 확인에 함께 처리할 영수증 정산 신청(개인 참여자·봉사자). 강사 지급조서와 같은 트랜잭션에서 승인하며 한 건이라도 실패하면 전체 롤백. 이체 예정일은 scheduledPaymentDate(또는 lectureFeePaymentScheduledDate)를 같이 쓴다.',
}

/** 지급조서 일괄 확인에 확정 전 강사 정산 신청서를 함께 보낸다(신청서 승인 → 지급조서 확인, 한 트랜잭션) */
const instructorSettlementBulkConfirmTarget = {
  type: 'object',
  required: ['settlementApplicationId'],
  description:
    '확정 전 강사 정산 신청서 일괄 확인 대상. 재제출은 새 신청서 ID를 만들므로 별도 revision 값은 받지 않는다.',
  properties: {
    settlementApplicationId: {
      type: 'integer',
      format: 'int64',
      minimum: 1,
      description:
        '강사 정산 신청서 ID. 지급조서 확인 라인(rowType=SETTLEMENT_APPLICATION)의 settlementApplicationId',
    },
  },
}

const bulkInstructorSettlementApplicationsProperty = {
  type: 'array',
  maxItems: 500,
  items: { $ref: '#/components/schemas/InstructorSettlementBulkConfirmTarget' },
  description:
    '지급조서 일괄 확인에 함께 처리할 확정 전 강사 정산 신청서. 신청서마다 승인 후 지급조서 확인까지 한 번에 처리하며 강사 지급조서·영수증과 같은 트랜잭션에서 한 건이라도 실패하면 전체 롤백. 이체 예정일은 scheduledPaymentDate(또는 lectureFeePaymentScheduledDate)를 같이 쓴다.',
}

const bulkInstructorSettlementApplicationResultsProperty = {
  type: 'array',
  description:
    '지급조서 일괄 확인에서 함께 처리한 확정 전 강사 정산 신청서 결과(단건 신청서 승인 응답과 같은 모양). 없으면 빈 배열',
  items: { $ref: '#/components/schemas/SettlementApplicationAdminActionResponse' },
}

for (const file of readdirSync(openapiDir).filter(name => name.endsWith('.openapi.json'))) {
  const path = join(openapiDir, file)
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  let changed = false

  for (const route of PAYEE_TYPE_QUERY_OPERATIONS) {
    const op = spec.paths?.[route]?.get
    if (!op) continue
    const params = (op.parameters ??= [])
    if (params.some(p => p.name === 'payeeType' && p.in === 'query')) continue
    const pageIndex = params.findIndex(p => p.name === 'page' && p.in === 'query')
    params.splice(pageIndex >= 0 ? pageIndex : params.length, 0, payeeTypeParameter)
    changed = true
  }

  const schemas = spec.components?.schemas
  const listProps = schemas?.SettlementListItemResponse?.properties
  if (listProps) {
    Object.assign(listProps, listItemProperties)
    if (listProps.rowType) {
      listProps.rowType = { ...listProps.rowType, enum: LIST_ROW_TYPE_ENUM, description: listRowTypeDescription }
    }
    changed = true
  }
  const bulkRequestProps = schemas?.SettlementBulkStatusChangeRequest?.properties
  if (bulkRequestProps) {
    schemas.IndividualSettlementBulkApprovalTarget = individualSettlementBulkApprovalTarget
    bulkRequestProps.individualSettlementApplications = bulkIndividualSettlementApplicationsProperty
    schemas.InstructorSettlementBulkConfirmTarget = instructorSettlementBulkConfirmTarget
    bulkRequestProps.instructorSettlementApplications = bulkInstructorSettlementApplicationsProperty
    changed = true
  }
  const bulkResponseProps = schemas?.SettlementBulkStatusChangeResponse?.properties
  if (bulkResponseProps && schemas?.SettlementApplicationAdminActionResponse) {
    bulkResponseProps.instructorSettlementApplicationResults =
      bulkInstructorSettlementApplicationResultsProperty
    changed = true
  }
  const calendarProps = schemas?.SettlementCalendarItemResponse?.properties
  if (calendarProps) {
    Object.assign(calendarProps, calendarItemProperties)
    changed = true
  }

  if (!changed) continue
  const indent = raw.startsWith('{\n    "') ? 4 : 2
  writeFileSync(path, `${JSON.stringify(spec, null, indent)}\n`)
  console.log(`patched ${file}`)
}
