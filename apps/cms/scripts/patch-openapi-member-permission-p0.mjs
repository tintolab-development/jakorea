/**
 * BE P0 member-permission-management 필드를 backend.openapi.json에 반영.
 * BE /v3/api-docs 미동기화 시 FE Orval codegen용 — BE spec handoff 2026-08-28 기준.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../openapi/backend.openapi.json')

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const schemas = spec.components?.schemas ?? {}

function ensureProperty(schemaName, propName, propSchema) {
  const schema = schemas[schemaName]
  if (!schema?.properties) {
    console.warn(`skip ${schemaName}: schema not found`)
    return false
  }
  if (schema.properties[propName]) {
    return false
  }
  schema.properties[propName] = propSchema
  return true
}

let patched = 0

if (
  ensureProperty('InstructorRoleRequestDetailResponse', 'joinedAt', {
    type: 'string',
    format: 'date-time',
    description: '회원 가입일 (member.joined_at)',
  })
) {
  patched++
}

if (
  ensureProperty('InstructorRoleRequestDetailResponse', 'notificationResentAt', {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: '승인 알림 재발송 시각',
  })
) {
  patched++
}

if (
  ensureProperty('InstructorRoleRequestDetailResponse', 'socialAccounts', {
    type: 'array',
    description: 'CONNECTED 소셜 계정 (GOOGLE/KAKAO/NAVER)',
    items: { $ref: '#/components/schemas/AdminLinkedSocialAccountResponse' },
  })
) {
  patched++
}

if (
  ensureProperty('TermsAgreement', 'agreedAt', {
    type: 'string',
    format: 'date-time',
    description: '약관 동의 시각',
  })
) {
  patched++
}

if (
  ensureProperty('AdminAccountApprovalDetailResponse', 'notificationResentAt', {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: '승인 알림 재발송 시각',
  })
) {
  patched++
}

const listOp = spec.paths?.['/api/admin/admin-approval-requests']?.get
if (listOp?.parameters && !listOp.parameters.some(p => p.name === 'status')) {
  listOp.parameters.splice(2, 0, {
    name: 'status',
    in: 'query',
    description:
      '승인 상태 필터. FE UI enum PENDING|APPROVED|REJECTED — BE가 PENDING_VERIFICATION/ACTIVE/REJECTED_VERIFICATION으로 normalize',
    required: false,
    schema: { type: 'string' },
  })
  patched++
}

writeFileSync(inputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log(`Patched backend.openapi.json (${patched} changes)`)
