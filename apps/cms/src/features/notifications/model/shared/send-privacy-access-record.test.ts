import { describe, expect, it } from 'vitest'
import {
  sendPrivacyAccessRecipientsKey,
  toSendPrivacyAccessRecipients,
} from '@/features/notifications/model/shared/send-privacy-access-record'

describe('toSendPrivacyAccessRecipients (CMS-21·22·25)', () => {
  it('MEMBER·ADMIN만 남기고 직접 입력·actorId 없는 행·중복은 뺀다', () => {
    const result = toSendPrivacyAccessRecipients([
      { id: 'actor-MEMBER-11', source: 'program', actorType: 'MEMBER', actorId: 11 },
      { id: 'actor-ADMIN-7', source: 'program', actorType: 'ADMIN' },
      { id: 'manual-1', source: 'manual', actorType: 'DIRECT' },
      { id: 'x', source: 'program', actorType: 'DIRECT' },
      { id: 'no-id', source: 'program', actorType: 'MEMBER' },
      { id: 'actor-MEMBER-11', source: 'program', actorId: 11 },
    ])
    expect(result).toEqual([
      { actorType: 'MEMBER', actorId: 11 },
      { actorType: 'ADMIN', actorId: 7 },
    ])
  })

  it('키는 순서와 무관하다', () => {
    expect(
      sendPrivacyAccessRecipientsKey([
        { actorType: 'MEMBER', actorId: 2 },
        { actorType: 'ADMIN', actorId: 1 },
      ])
    ).toBe(
      sendPrivacyAccessRecipientsKey([
        { actorType: 'ADMIN', actorId: 1 },
        { actorType: 'MEMBER', actorId: 2 },
      ])
    )
  })
})
