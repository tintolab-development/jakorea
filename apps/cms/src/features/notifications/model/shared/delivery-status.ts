/**
 * 알림 발송 이력(메일·알림톡·문자) 발송·수신 상태 — 세 채널 공통 정본.
 * 라벨: Figma Status / Text / 메일 발송 형태(14804:19688). 준비중·인증 대기는 서버 대응 값이 없어 쓰지 않는다(2026-11-09 확정).
 * 발송 완료(SENT) 라벨은 발송 조회 화면 시안(6289:93622 등)에 맞춰 「발송 성공」으로 쓴다(2026-11-10 결정).
 *
 * 서버 계약(NotificationService.sendStatus/receiptStatus, 채널 공통):
 * - sendStatus: REQUESTED | SCHEDULED | WAITED | IN_PROGRESS | SENT | SEND_FAILED | CANCELED | UNKNOWN
 *   (그 밖의 원시값 SKIPPED·RETRY 등은 그대로 내려오며 '확인불가'로 본다)
 * - 예약 취소: 서버는 발송 취소와 같은 CANCELED를 쓴다. 예약 발송(scheduledAt 있음)의 CANCELED만 '예약 취소'로 구분한다.
 */

export const NOTIFICATION_SEND_STATUS_LABELS = [
  '발송 요청',
  '예약',
  '발송 대기',
  '발송 중',
  '발송 성공',
  '발송 실패',
  '발송 취소',
  '예약 취소',
  '확인불가',
] as const

export type NotificationSendStatusLabel = (typeof NOTIFICATION_SEND_STATUS_LABELS)[number]

export const NOTIFICATION_SEND_STATUS_OPTIONS = ['전체', ...NOTIFICATION_SEND_STATUS_LABELS] as const

export const NOTIFICATION_RECEIVE_STATUS_LABELS = [
  '요청됨',
  '확인 대기중',
  '대기중',
  '예약됨',
  '수신 성공',
  '수신 실패',
  '취소됨',
  '확인불가',
] as const

export type NotificationReceiveStatusLabel = (typeof NOTIFICATION_RECEIVE_STATUS_LABELS)[number]

export const NOTIFICATION_RECEIVE_STATUS_OPTIONS = ['전체', ...NOTIFICATION_RECEIVE_STATUS_LABELS] as const

const SEND_STATUS_BY_CODE: Record<string, NotificationSendStatusLabel> = {
  REQUESTED: '발송 요청',
  SCHEDULED: '예약',
  WAITED: '발송 대기',
  IN_PROGRESS: '발송 중',
  SENT: '발송 성공',
  SEND_FAILED: '발송 실패',
  CANCELED: '발송 취소',
  UNKNOWN: '확인불가',
}

const RECEIVE_STATUS_BY_CODE: Record<string, NotificationReceiveStatusLabel> = {
  REQUESTED: '요청됨',
  CONFIRM_WAITED: '확인 대기중',
  WAITED: '대기중',
  READY: '대기중',
  IN_PROGRESS: '대기중',
  SCHEDULED: '예약됨',
  SENT: '수신 성공',
  DELIVERED: '수신 성공',
  SEND_FAILED: '수신 실패',
  DELIVERY_FAILED: '수신 실패',
  CANCELED: '취소됨',
  UNKNOWN: '확인불가',
}

function normalizeCode(raw: string | null | undefined): string {
  return (raw ?? '').trim().toUpperCase()
}

/** 서버 NotificationService.sendStatus() 변환표와 같은 원시값 별칭 — 그 밖의 값은 정규화하지 않는다 */
const SEND_STATUS_SERVER_ALIASES: Record<string, string> = {
  QUEUED: 'REQUESTED',
  ACCEPTED: 'REQUESTED',
  RESERVED: 'SCHEDULED',
  READY: 'WAITED',
  CONFIRM_WAITED: 'WAITED',
  WAITING_CONFIRMATION: 'WAITED',
  SENDING: 'IN_PROGRESS',
  DELIVERED: 'SENT',
  DELIVERY_FAILED: 'SENT',
  FAILED: 'SEND_FAILED',
  CANCELLED: 'CANCELED',
}

/** 서버 NotificationService.receiptStatus() 변환표와 같은 원시값 별칭 */
const RECEIVE_STATUS_SERVER_ALIASES: Record<string, string> = {
  QUEUED: 'REQUESTED',
  RESERVED: 'SCHEDULED',
  WAITING_CONFIRMATION: 'CONFIRM_WAITED',
  SENDING: 'IN_PROGRESS',
  FAILED: 'SEND_FAILED',
  CANCELLED: 'CANCELED',
}

/** 서버 sendStatus → 라벨. `scheduled`: 예약 발송 여부(scheduledAt·sendTiming) — CANCELED를 예약 취소로 구분 */
export function mapNotificationSendStatus(
  raw: string | null | undefined,
  options: { scheduled: boolean }
): NotificationSendStatusLabel {
  const code = normalizeCode(raw)
  const label = SEND_STATUS_BY_CODE[SEND_STATUS_SERVER_ALIASES[code] ?? code] ?? '확인불가'
  return label === '발송 취소' && options.scheduled ? '예약 취소' : label
}

/** 서버 receiptStatus → 라벨. 모르는 값은 '확인불가' */
export function mapNotificationReceiveStatus(
  raw: string | null | undefined
): NotificationReceiveStatusLabel {
  const code = normalizeCode(raw)
  return RECEIVE_STATUS_BY_CODE[RECEIVE_STATUS_SERVER_ALIASES[code] ?? code] ?? '확인불가'
}

const SEND_FILTER_BY_LABEL: Record<string, { sendStatus: string; sendTiming?: 'IMMEDIATE' | 'SCHEDULED' }> = {
  '발송 요청': { sendStatus: 'REQUESTED' },
  예약: { sendStatus: 'SCHEDULED' },
  '발송 대기': { sendStatus: 'WAITED' },
  '발송 중': { sendStatus: 'IN_PROGRESS' },
  '발송 성공': { sendStatus: 'SENT' },
  '발송 실패': { sendStatus: 'SEND_FAILED' },
  '발송 취소': { sendStatus: 'CANCELED', sendTiming: 'IMMEDIATE' },
  '예약 취소': { sendStatus: 'CANCELED', sendTiming: 'SCHEDULED' },
  확인불가: { sendStatus: 'UNKNOWN' },
  // 이전 채널별 라벨로 저장된 URL 호환
  대기: { sendStatus: 'WAITED' },
  발송중: { sendStatus: 'IN_PROGRESS' },
  '발송 완료': { sendStatus: 'SENT' },
  '발송 예약': { sendStatus: 'SCHEDULED' },
  취소: { sendStatus: 'CANCELED' },
}

const RECEIVE_FILTER_BY_LABEL: Record<string, string> = {
  요청됨: 'REQUESTED',
  '확인 대기중': 'CONFIRM_WAITED',
  대기중: 'WAITED',
  예약됨: 'SCHEDULED',
  '수신 성공': 'DELIVERED',
  '수신 실패': 'DELIVERY_FAILED',
  취소됨: 'CANCELED',
  확인불가: 'UNKNOWN',
}

/**
 * 상태 필터 → 발송 이력 조회 파라미터(sendStatus·receiptStatus·sendTiming).
 * 발송 취소/예약 취소는 sendTiming으로 나눈다 — 발송 시점 필터보다 상태 필터의 시점이 우선한다.
 */
export function applyNotificationStatusFilterParams(
  params: Record<string, string>,
  filters: { sendStatus: string; receiveStatus: string; broadcastTiming: string }
): void {
  if (filters.broadcastTiming === '즉시') params.sendTiming = 'IMMEDIATE'
  if (filters.broadcastTiming === '예약') params.sendTiming = 'SCHEDULED'
  if (filters.sendStatus !== '전체') {
    const send = SEND_FILTER_BY_LABEL[filters.sendStatus]
    if (send) {
      params.sendStatus = send.sendStatus
      if (send.sendTiming) params.sendTiming = send.sendTiming
    }
  }
  if (filters.receiveStatus !== '전체') {
    const receipt = RECEIVE_FILTER_BY_LABEL[filters.receiveStatus]
    if (receipt) params.receiptStatus = receipt
  }
}
