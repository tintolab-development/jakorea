/**
 * BE OpenAPI v9: `CreateRequest` 이름이 signup intent와 알림 배치 생성에 충돌한다.
 * notifications subset에서는 알림 실발송 배치 생성 스키마를 SSOT로 고정한다.
 * 발송 배치 상세(bodySnapshot·첨부 스냅샷)도 BE `/v3/api-docs` 기준으로 맞춘다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const notificationsPath = join(__dirname, '../openapi/notifications.openapi.json')

const NOTIFICATION_SEND_BATCH_CREATE_REQUEST = {
  type: 'object',
  properties: {
    batchName: { type: 'string', maxLength: 200, minLength: 0 },
    templateId: { type: 'integer', format: 'int64' },
    programId: {
      type: 'integer',
      format: 'int64',
      description:
        '대상 프로그램. 미전달(발송 UI 미선택/지정 해제)이면 program 스코프 enrich 불가.\nrequiresProgram 변수 포함 템플릿은 NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES.\nMEMBER(전체회원 팝업)와 DIRECT는 허용, ADMIN 수신자는 프로그램 필수.\nFE는 문자열 all을 보내지 않음(필드 생략).\n',
    },
    scheduledAt: {
      type: 'string',
      format: 'date-time',
      description: '예약 시각 ISO-8601. 즉시 발송이면 생략. Hub scheduledDateTime은 사용하지 않음.',
    },
    variables: { type: 'object', additionalProperties: {} },
    recipients: {
      type: 'array',
      items: { $ref: '#/components/schemas/RecipientRequest' },
      maxItems: 500,
      minItems: 0,
    },
    senderKey: {
      type: 'string',
      description:
        'EMAIL은 From 메일주소. senderProfileId가 없을 때 이 값으로 프로필/템플릿 발신 메일을 매칭합니다.',
      maxLength: 255,
      minLength: 0,
    },
    senderProfileType: { type: 'string', maxLength: 20, minLength: 0 },
    senderProfileId: {
      type: 'integer',
      format: 'int64',
      description: '발신 프로필 id. EMAIL은 channelType=EMAIL 프로필. 없으면 senderKey로 매칭.',
    },
    titleTemplate: {
      type: 'string',
      description:
        '발송 시점 제목 스냅샷(SMS LMS/MMS·EMAIL만). 생략 시 등록 템플릿 title_template 사용.\nALIMTALK에 전달 시 NOTIFICATION_SEND_BODY_OVERRIDE_NOT_ALLOWED_FOR_ALIMTALK.\n',
      maxLength: 1000,
      minLength: 0,
    },
    contentTemplate: {
      type: 'string',
      description:
        '발송 시점 본문 스냅샷(SMS·EMAIL만). 등록 템플릿과 달라도 됨. 안의 #{키}는 variables/enrich로 치환.\n생략 시 등록 템플릿 content_template 사용. ALIMTALK 전달 시 거부.\n',
    },
    // BE JABACK PR #43: 템플릿 없는 SMS(templateId 생략) 문자 유형
    messageType: {
      type: 'string',
      description:
        '템플릿 없는 SMS 문자 유형 SMS|LMS|MMS. templateId가 있으면 무시(템플릿 유형 사용).',
    },
    // BE JABACK PR #43: 메일 발송 발신자명(이번 발송만)
    senderProfileDisplayName: {
      type: 'string',
      description: 'EMAIL 전용 발신자명. 비우면 NHN 프로필 표시명. 다른 채널은 400.',
      maxLength: 255,
      minLength: 0,
    },
    // BE MMS 첨부: upload-requests(MMS_IMAGE) → confirm → CLEAN/AVAILABLE 된 fileObjectId
    attachmentFileIds: {
      type: 'array',
      description:
        'MMS 전용 첨부 fileObjectId(선택 순서). 비MMS에 1개 이상이면 400 NOTIFICATION_ATTACHMENT_ONLY_MMS.\n템플릿 MMS에서 생략/[]이면 템플릿 첨부, 1개 이상이면 요청 첨부만 사용(병합 없음).\n',
      items: { type: 'integer', format: 'int64' },
    },
  },
  // templateId: SMS는 생략 가능(템플릿 없는 SMS). 알림톡·메일은 BE가 필수 검증.
  required: ['batchName', 'recipients'],
}

/** BE `/v3/api-docs` 그대로 (GET /api/admin/notification-send-batches/{batchId}) */
const ATTACHMENT_SNAPSHOT_RESPONSE = {
  type: 'object',
  properties: {
    fileObjectId: { type: 'integer', format: 'int64' },
    fileName: { type: 'string' },
  },
}

const BATCH_BODY_SNAPSHOT_RESPONSE = {
  type: 'object',
  description:
    '발송 시점 스냅샷. titleTemplate/contentTemplate null = 등록 템플릿 본문 사용(템플릿 발송) 또는 보존기간 만료 파기.\nsenderKey는 템플릿 없는 SMS 발신번호, senderDisplayName은 EMAIL 발신자명 덮어쓰기 값(없으면 null).\nattachments는 배치 생성 시 확정된 MMS fileObjectId/fileName 스냅샷이며 예약 발송에도 동일하게 유지됩니다.\n',
  properties: {
    titleTemplate: { type: 'string' },
    contentTemplate: { type: 'string' },
    senderKey: { type: 'string' },
    senderDisplayName: { type: 'string' },
    attachments: {
      type: 'array',
      items: { $ref: '#/components/schemas/AttachmentSnapshotResponse' },
    },
  },
}

const BATCH_SUMMARY_EXTRA_PROPERTIES = {
  templateUsed: {
    type: 'boolean',
    description: 'false = 템플릿 없이 발송한 SMS. 이때 templateId·templateCode는 null.',
  },
  messagePurpose: {
    type: 'string',
    description: '발송 목적 NORMAL|AD|AUTH. 템플릿 없는 SMS는 항상 NORMAL.',
  },
  smsMessageType: {
    type: 'string',
    description: 'SMS 채널 문자 유형 SMS|LMS|MMS. SMS 외 채널은 null.',
  },
}

const RECIPIENT_REQUEST = {
  type: 'object',
  properties: {
    actorType: { type: 'string', minLength: 1 },
    actorId: { type: 'integer', format: 'int64' },
    recipientContact: { type: 'string', maxLength: 255, minLength: 0 },
    recipientName: { type: 'string', maxLength: 255, minLength: 0 },
    variables: { type: 'object', additionalProperties: {} },
  },
  required: ['actorType'],
}

const spec = JSON.parse(readFileSync(notificationsPath, 'utf8'))
if (!spec.components) spec.components = {}
if (!spec.components.schemas) spec.components.schemas = {}

spec.components.schemas.CreateRequest = NOTIFICATION_SEND_BATCH_CREATE_REQUEST
spec.components.schemas.RecipientRequest = RECIPIENT_REQUEST
spec.components.schemas.AttachmentSnapshotResponse = ATTACHMENT_SNAPSHOT_RESPONSE
spec.components.schemas.BatchBodySnapshotResponse = BATCH_BODY_SNAPSHOT_RESPONSE
const batchDetail = spec.components.schemas.BatchDetailResponse
if (batchDetail?.properties) {
  batchDetail.properties.bodySnapshot = { $ref: '#/components/schemas/BatchBodySnapshotResponse' }
}
const batchSummary = spec.components.schemas.BatchSummaryResponse
if (batchSummary?.properties) {
  Object.assign(batchSummary.properties, BATCH_SUMMARY_EXTRA_PROPERTIES)
}

writeFileSync(notificationsPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log(`Patched notification send batch CreateRequest in ${notificationsPath}`)
