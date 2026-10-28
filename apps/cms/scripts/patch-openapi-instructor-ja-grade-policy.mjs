/**
 * 강사 취소 faultParty OpenAPI 반영.
 * backend.openapi.json → InstructorAssignmentCancelRequest /
 * InstructorApplicationApprovalCancellationRequest, 강사 cancel 경로 requestBody 교체.
 * InstructorJaEvaluationResponse 는 로컬 BE 스펙을 덮어쓰지 않는다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../openapi/backend.openapi.json')

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const schemas = spec.components?.schemas ?? {}
const paths = spec.paths ?? {}

const faultPartySchema = {
  type: 'string',
  nullable: true,
  description:
    '취소 귀책. USER=강사 사유(JA 감점 대상), ADMIN=운영 사유(감점 없음). 생략/null이면 서버가 ADMIN 처리.',
  enum: ['USER', 'ADMIN'],
}

schemas.InstructorAssignmentCancelRequest = {
  type: 'object',
  description: '강사 배정 취소 요청. 봉사자/UJAT AssignmentCancelRequest와 분리되며 faultParty를 포함한다.',
  properties: {
    reason: {
      type: 'string',
      description:
        '취소 사유. 이미 배정 알림이 발송된 경우 필수이며, 발송 전 취소에서는 생략할 수 있습니다.',
      example: '강사 개인 사정으로 배정 취소',
      maxLength: 500,
      minLength: 0,
    },
    timing: {
      type: 'string',
      description:
        '취소 알림 발송 방식. IMMEDIATE 또는 SCHEDULED. 이미 배정 알림이 발송된 경우에만 사용됩니다.',
      example: 'IMMEDIATE',
    },
    scheduledAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description:
        '취소 알림 직접 설정 시 예약 발송 시각. timing=SCHEDULED일 때 필수이며 미래 시각이어야 합니다.',
    },
    faultParty: faultPartySchema,
  },
}

schemas.InstructorApplicationApprovalCancellationRequest = {
  type: 'object',
  description:
    '강사 신청 승인 취소 요청. 승인 취소 1건 = JA 감점 1건. 연쇄 배정 취소는 별도 집계하지 않는다.',
  properties: {
    reason: {
      type: 'string',
      maxLength: 500,
      minLength: 0,
      example: '강사 개인 사정',
    },
    notification: {
      $ref: '#/components/schemas/Notification',
    },
    faultParty: faultPartySchema,
  },
}

function setRequestBodySchema(pathKey, method, schemaRef) {
  const operation = paths[pathKey]?.[method]
  if (!operation) {
    console.warn(`skip ${method.toUpperCase()} ${pathKey}: operation not found`)
    return
  }
  operation.requestBody = {
    content: {
      'application/json': {
        schema: { $ref: schemaRef },
      },
    },
    required: true,
  }
}

setRequestBodySchema(
  '/api/admin/instructor-assignments/{assignmentId}/cancel',
  'patch',
  '#/components/schemas/InstructorAssignmentCancelRequest'
)
setRequestBodySchema(
  '/api/admin/program-execution/instructor-assignments/{assignmentId}/cancel',
  'post',
  '#/components/schemas/InstructorAssignmentCancelRequest'
)
setRequestBodySchema(
  '/api/admin/instructor-applications/{applicationId}/cancel-approval',
  'post',
  '#/components/schemas/InstructorApplicationApprovalCancellationRequest'
)

writeFileSync(inputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log('Patched instructor faultParty cancel schemas')
