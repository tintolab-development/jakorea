import { describe, expect, it } from 'vitest'
import {
  alimtalkSyncSuccessMessage,
  mailSyncSuccessMessage,
  notificationTemplateSyncSuccessMessage,
  smsSyncSuccessMessage,
  type AlimtalkSyncOutcome,
} from '@/features/notifications/api/adapters/alimtalk-sync-adapters'

function outcome(partial: Partial<AlimtalkSyncOutcome>): AlimtalkSyncOutcome {
  return {
    mode: 'UNKNOWN',
    upsertedCount: 0,
    isNhnLivePull: false,
    isLocalApprovalMark: false,
    isRequestUpsert: false,
    ...partial,
  }
}

describe('notificationTemplateSyncSuccessMessage', () => {
  it('NHN_LIVE_PULL: 채널별 템플릿 N건 toast', () => {
    const live = outcome({
      isNhnLivePull: true,
      mode: 'NHN_LIVE_PULL',
      upsertedCount: 7,
    })
    expect(notificationTemplateSyncSuccessMessage('ALIMTALK', live)).toBe(
      '알림톡 템플릿 7건이 반영되었습니다.'
    )
    expect(notificationTemplateSyncSuccessMessage('EMAIL', live)).toBe(
      '메일 템플릿 7건이 반영되었습니다.'
    )
    expect(notificationTemplateSyncSuccessMessage('SMS', live)).toBe(
      'SMS 템플릿 7건이 반영되었습니다.'
    )
  })

  it('SMS + LOCAL_APPROVAL_MARK: 성공 toast (JA_NOTIFICATION_MODE 경고 금지)', () => {
    const message = smsSyncSuccessMessage(
      outcome({ isLocalApprovalMark: true, mode: 'LOCAL_APPROVAL_MARK', upsertedCount: 3 })
    )
    expect(message).toBe('SMS 템플릿 3건이 반영되었습니다.')
    expect(message).not.toContain('JA_NOTIFICATION_MODE')
    expect(message).not.toContain('문자 카테고리')
  })

  it('ALIMTALK|EMAIL + LOCAL_APPROVAL_MARK: NHN 모드 안내만', () => {
    const local = outcome({ isLocalApprovalMark: true, mode: 'LOCAL_APPROVAL_MARK' })
    expect(alimtalkSyncSuccessMessage(local)).toContain('JA_NOTIFICATION_MODE')
    expect(mailSyncSuccessMessage(local)).toContain('JA_NOTIFICATION_MODE')
  })

  it('wrapper는 채널 SSOT를 따른다', () => {
    const live = outcome({ isNhnLivePull: true, mode: 'NHN_LIVE_PULL', upsertedCount: 12 })
    expect(alimtalkSyncSuccessMessage(live)).toBe('알림톡 템플릿 12건이 반영되었습니다.')
    expect(mailSyncSuccessMessage(live)).toBe('메일 템플릿 12건이 반영되었습니다.')
  })
})
