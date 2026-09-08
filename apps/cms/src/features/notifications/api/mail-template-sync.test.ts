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
  it('warns when BE is not in NHN mode', () => {
    expect(mailSyncSuccessMessage(outcome({ isLocalApprovalMark: true, mode: 'LOCAL_APPROVAL_MARK' }))).toContain(
      'JA_NOTIFICATION_MODE'
    )
  })

  it('reports upserted count for NHN live pull', () => {
    expect(
      mailSyncSuccessMessage(
        outcome({ isNhnLivePull: true, mode: 'NHN_LIVE_PULL', upsertedCount: 3 })
      )
    ).toContain('3건')
  })

  it('returns generic success otherwise', () => {
    expect(mailSyncSuccessMessage(outcome({}))).toBe(
      '카테고리·발신 프로필 연동이 완료되었습니다.'
    )
  })
})
