import { describe, expect, it } from 'vitest'
import { mailSyncSuccessMessage } from './mail-template-service'
import type { AlimtalkSyncOutcome } from '@/features/notifications/api/adapters/alimtalk-sync-adapters'

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

describe('mailSyncSuccessMessage', () => {
  it('warns when BE is not in NHN mode (EMAIL only)', () => {
    expect(mailSyncSuccessMessage(outcome({ isLocalApprovalMark: true, mode: 'LOCAL_APPROVAL_MARK' }))).toContain(
      'JA_NOTIFICATION_MODE'
    )
  })

  it('reports upserted count for NHN live pull', () => {
    expect(
      mailSyncSuccessMessage(
        outcome({ isNhnLivePull: true, mode: 'NHN_LIVE_PULL', upsertedCount: 3 })
      )
    ).toBe('메일 템플릿 3건이 반영되었습니다.')
  })

  it('returns refresh fallback for unknown mode', () => {
    expect(mailSyncSuccessMessage(outcome({}))).toBe(
      '동기화가 완료되었습니다. 목록을 새로고침합니다.'
    )
  })
})
