import { describe, expect, it } from 'vitest'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { isRecipientCandidateQueryKey } from './recipient-candidates-cache'

describe('isRecipientCandidateQueryKey', () => {
  it('matches sms, mail, and alimtalk recipient candidate keys only', () => {
    expect(isRecipientCandidateQueryKey(notificationsQueryKeys.smsSend.recipients('a'))).toBe(true)
    expect(isRecipientCandidateQueryKey(notificationsQueryKeys.mailSend.recipients('a'))).toBe(true)
    expect(isRecipientCandidateQueryKey(notificationsQueryKeys.alimtalkSend.recipients('a'))).toBe(
      true
    )
    expect(isRecipientCandidateQueryKey(notificationsQueryKeys.smsSend.senderProfiles())).toBe(
      false
    )
    expect(isRecipientCandidateQueryKey(notificationsQueryKeys.all)).toBe(false)
  })
})
