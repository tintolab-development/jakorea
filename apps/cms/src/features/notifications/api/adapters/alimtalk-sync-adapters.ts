import type { SyncResultResponse } from '@/shared/api/generated/notifications/schemas'

export const ALIMTALK_SYNC_MODE_NHN_LIVE_PULL = 'NHN_LIVE_PULL'
export const ALIMTALK_SYNC_MODE_LOCAL_APPROVAL_MARK = 'LOCAL_APPROVAL_MARK'
export const ALIMTALK_SYNC_MODE_REQUEST_UPSERT = 'REQUEST_UPSERT'

export type AlimtalkSyncMode =
  | typeof ALIMTALK_SYNC_MODE_NHN_LIVE_PULL
  | typeof ALIMTALK_SYNC_MODE_LOCAL_APPROVAL_MARK
  | typeof ALIMTALK_SYNC_MODE_REQUEST_UPSERT
  | string

/** sync?channelType= 과 동일. 화면 채널 SSOT */
export type NotificationSyncChannelType = 'ALIMTALK' | 'SMS' | 'EMAIL'

export type AlimtalkSyncOutcome = {
  mode: AlimtalkSyncMode
  upsertedCount: number
  syncedAt?: string
  resource?: string
  isNhnLivePull: boolean
  isLocalApprovalMark: boolean
  isRequestUpsert: boolean
}

export function mapSyncResultResponse(
  result: SyncResultResponse | null | undefined
): AlimtalkSyncOutcome {
  const mode = (result?.mode ?? '').trim() || 'UNKNOWN'
  return {
    mode,
    upsertedCount: result?.upsertedCount ?? 0,
    syncedAt: result?.syncedAt,
    resource: result?.resource,
    isNhnLivePull: mode === ALIMTALK_SYNC_MODE_NHN_LIVE_PULL,
    isLocalApprovalMark: mode === ALIMTALK_SYNC_MODE_LOCAL_APPROVAL_MARK,
    isRequestUpsert: mode === ALIMTALK_SYNC_MODE_REQUEST_UPSERT,
  }
}

const CHANNEL_LABEL: Record<NotificationSyncChannelType, string> = {
  ALIMTALK: '알림톡',
  SMS: 'SMS',
  EMAIL: '메일',
}

const NHN_MODE_WARN =
  'BE가 NHN 모드가 아닙니다(JA_NOTIFICATION_MODE). NHN live pull이 되지 않습니다. BE에 JA_NOTIFICATION_MODE=NHN_NOTIFICATION_HUB 설정을 요청해 주세요.'

function templateReflectedMessage(channel: NotificationSyncChannelType, count: number): string {
  return `${CHANNEL_LABEL[channel]} 템플릿 ${count.toLocaleString()}건이 반영되었습니다.`
}

/**
 * 알림 템플릿 sync toast — BE mode/channel SSOT.
 * - NHN_LIVE_PULL: 「{채널} 템플릿 N건이 반영되었습니다.」
 * - SMS + LOCAL_APPROVAL_MARK: 「SMS 로컬 갱신 N건」 (NHN 모드 경고 금지)
 * - ALIMTALK|EMAIL + LOCAL_APPROVAL_MARK: JA_NOTIFICATION_MODE 안내만
 */
export function notificationTemplateSyncSuccessMessage(
  channel: NotificationSyncChannelType,
  outcome: AlimtalkSyncOutcome
): string {
  if (outcome.isNhnLivePull) {
    return templateReflectedMessage(channel, outcome.upsertedCount)
  }

  if (outcome.isLocalApprovalMark) {
    if (channel === 'SMS') {
      // NHN 기대인데 LOCAL이면 폴백/설정 이슈. JA_NOTIFICATION_MODE 경고 금지.
      return `SMS 로컬 갱신 ${outcome.upsertedCount.toLocaleString()}건`
    }
    return NHN_MODE_WARN
  }

  if (outcome.isRequestUpsert) {
    if (import.meta.env.DEV) {
      console.warn(
        `[${channel} sync] REQUEST_UPSERT는 FE 일반 화면 경로가 아닙니다.`,
        outcome
      )
    }
    return '동기화가 완료되었습니다.'
  }

  return '동기화가 완료되었습니다. 목록을 새로고침합니다.'
}

export function alimtalkSyncSuccessMessage(outcome: AlimtalkSyncOutcome): string {
  return notificationTemplateSyncSuccessMessage('ALIMTALK', outcome)
}

export function smsSyncSuccessMessage(outcome: AlimtalkSyncOutcome): string {
  return notificationTemplateSyncSuccessMessage('SMS', outcome)
}

export function mailSyncSuccessMessage(outcome: AlimtalkSyncOutcome): string {
  return notificationTemplateSyncSuccessMessage('EMAIL', outcome)
}
