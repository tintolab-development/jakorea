/**
 * BE OpenAPI v9: `CreateRequest` 이름이 signup intent와 알림 배치 생성에 충돌한다.
 * notifications subset에서는 알림 실발송 배치 생성 스키마를 SSOT로 고정한다.
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
  },
  required: ['batchName', 'recipients', 'templateId'],
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

writeFileSync(notificationsPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log(`Patched notification send batch CreateRequest in ${notificationsPath}`)
