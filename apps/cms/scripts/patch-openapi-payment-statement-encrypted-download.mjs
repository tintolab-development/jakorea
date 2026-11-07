/**
 * CMS 지급조서 암호화 다운로드 계약.
 * GET .../payment-statement/download = 미리보기 JSON
 * POST .../payment-statement/download = password writeOnly + PDF binary
 * POST .../download-requests = 동일 본문/200 PDF (404/405 폴백)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../openapi/backend.openapi.json')
const spec = JSON.parse(readFileSync(inputPath, 'utf8'))

const DOWNLOAD_PATH = '/api/admin/settlements/{settlementId}/payment-statement/download'
const FALLBACK_PATH = '/api/admin/settlements/{settlementId}/payment-statement/download-requests'
const REQUEST_SCHEMA = 'EncryptedPaymentStatementDownloadRequest'

const binarySchema = { type: 'string', format: 'binary' }
const binaryContent = {
  'application/pdf': { schema: binarySchema },
  'application/octet-stream': { schema: binarySchema },
  '*/*': { schema: binarySchema },
}

const password400Examples = {
  'password-required': {
    summary: '암호 미입력',
    value: {
      success: false,
      data: null,
      message: '파일 암호를 입력해 주세요.',
      error: { code: 'DOWNLOAD_PASSWORD_REQUIRED', field: 'password' },
    },
  },
  'password-invalid': {
    summary: '암호 형식 불일치',
    value: {
      success: false,
      data: null,
      message: '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
      error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
    },
  },
}

function jsonErrorResponse(description, extraExamples) {
  const examples = {
    'bad-request': {
      summary: description,
      value: {
        success: false,
        data: null,
        message: 'BAD_REQUEST: request parameter is invalid',
      },
    },
    ...(extraExamples ?? {}),
  }
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponse' },
        examples,
      },
    },
  }
}

const encryptedPostResponses = {
  200: {
    description: '암호화된 PDF binary. downloadUrl JSON이 아님.',
    headers: {
      'Content-Disposition': {
        schema: { type: 'string' },
        description: "attachment; filename*=UTF-8''…",
      },
      'Cache-Control': {
        schema: { type: 'string', example: 'private, no-store' },
      },
    },
    content: binaryContent,
  },
  400: jsonErrorResponse('요청 값 검증 실패', password400Examples),
  401: jsonErrorResponse('인증 필요'),
  403: jsonErrorResponse('권한 부족'),
  404: jsonErrorResponse('대상 리소스 없음'),
  409: jsonErrorResponse('비즈니스 상태 충돌 또는 중복 요청'),
  500: {
    description:
      '감사로그 저장 또는 서버 처리 실패입니다. 개인정보/민감파일 요청은 감사 실패 시 차단 정책(fail-closed 정책)으로 성공 처리하지 않습니다.',
  },
}

const requestBody = {
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${REQUEST_SCHEMA}` },
    },
  },
}

spec.components ??= {}
spec.components.schemas ??= {}
spec.components.schemas[REQUEST_SCHEMA] = {
  type: 'object',
  required: ['password'],
  properties: {
    password: {
      type: 'string',
      writeOnly: true,
      minLength: 8,
      description:
        '파일 암호. 8자 이상, 영문+숫자+특수문자, 공백 불가. 쿼리/로그/분석에 넣지 않는다.',
    },
  },
}

const downloadItem = spec.paths?.[DOWNLOAD_PATH]
if (!downloadItem) {
  console.error(`missing path ${DOWNLOAD_PATH}`)
  process.exit(1)
}

downloadItem.post = {
  tags: ['정산'],
  summary: '지급조서 암호화 PDF 다운로드',
  description:
    'FILE_DOWNLOAD 권한. 본문 password로 암호화된 PDF binary를 반환한다. GET 미리보기 downloadUrl은 쓰지 않는다.',
  operationId: 'downloadPaymentStatementEncrypted',
  parameters: [
    {
      name: 'settlementId',
      in: 'path',
      required: true,
      schema: { type: 'integer', format: 'int64' },
    },
  ],
  requestBody,
  responses: encryptedPostResponses,
}

const fallbackItem = spec.paths?.[FALLBACK_PATH]
if (!fallbackItem?.post) {
  console.error(`missing path ${FALLBACK_PATH} POST`)
  process.exit(1)
}

fallbackItem.post.requestBody = requestBody
fallbackItem.post.responses = {
  ...fallbackItem.post.responses,
  ...encryptedPostResponses,
}

writeFileSync(inputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log('Patched payment-statement encrypted download POST + download-requests fallback')
