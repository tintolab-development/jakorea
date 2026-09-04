import type { SyncResultResponse } from '@/shared/api/generated/notifications/schemas'

export const ALIMTALK_SYNC_MODE_NHN_LIVE_PULL = 'NHN_LIVE_PULL'
export const ALIMTALK_SYNC_MODE_LOCAL_APPROVAL_MARK = 'LOCAL_APPROVAL_MARK'
export const ALIMTALK_SYNC_MODE_REQUEST_UPSERT = 'REQUEST_UPSERT'

export type AlimtalkSyncMode =
  | typeof ALIMTALK_SYNC_MODE_NHN_LIVE_PULL
  | typeof ALIMTALK_SYNC_MODE_LOCAL_APPROVAL_MARK
  | typeof ALIMTALK_SYNC_MODE_REQUEST_UPSERT
  | string

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

export function alimtalkSyncSuccessMessage(outcome: AlimtalkSyncOutcome): string {
  if (outcome.isNhnLivePull) {
    return `NHN 동기화가 완료되었습니다. 템플릿 ${outcome.upsertedCount.toLocaleString()}건이 반영되었습니다.`
  }
  if (outcome.isLocalApprovalMark) {
    return 'BE가 NHN 모드가 아닙니다(JA_NOTIFICATION_MODE). NHN live pull이 되지 않습니다. BE에 JA_NOTIFICATION_MODE=NHN_NOTIFICATION_HUB 설정을 요청해 주세요.'
  }
  if (outcome.isRequestUpsert) {
    if (import.meta.env.DEV) {
      console.warn('[alimtalk sync] REQUEST_UPSERT는 FE 일반 화면 경로가 아닙니다.', outcome)
    }
    return '동기화가 완료되었습니다.'
  }
  return '동기화가 완료되었습니다. 목록을 새로고침합니다.'
}
