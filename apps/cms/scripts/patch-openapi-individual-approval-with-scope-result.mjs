/**
 * Springdoc inner-class 이름 충돌 보정.
 * live `/v3/api-docs` 의 `Result` 가 AGE14 guardian cleanup 으로 덮이면
 * `POST .../approve-with-education-scope` 응답 타입이 깨진다.
 * 승인 응답은 `IndividualApprovalWithScopeResult` 로 분리한다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../openapi/backend.openapi.json')

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const schemas = spec.components?.schemas ?? {}
const resultProps = schemas.Result?.properties ?? {}

if (resultProps.decision && resultProps.educationScope) {
  console.log('skip individual-approval Result split: Result already has decision/educationScope')
  process.exit(0)
}

schemas.IndividualApprovalWithScopeResult = {
  type: 'object',
  description:
    '개인 신청 교육 범위 승인 응답. Springdoc Result 이름 충돌을 피하기 위해 FE에서 분리한다.',
  properties: {
    decision: {
      $ref: '#/components/schemas/ApplicationDecisionResponse',
    },
    educationScope: {
      $ref: '#/components/schemas/ScopeResponse',
    },
  },
}

const approvePath =
  spec.paths?.['/api/admin/individual-applications/{applicationId}/approve-with-education-scope']
    ?.post
const okSchema = approvePath?.responses?.['200']?.content?.['*/*']?.schema
if (okSchema) {
  okSchema.$ref = '#/components/schemas/IndividualApprovalWithScopeResult'
}

writeFileSync(inputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log('Patched IndividualApprovalWithScopeResult for approve-with-education-scope')
