import { describe, expect, it } from 'vitest'
import type { RecipientCandidateResponse } from '@/shared/api/generated/notifications/schemas'
import { mapSmsRecipientCandidate } from './sms-send-adapters'

function candidate(
  overrides: Partial<RecipientCandidateResponse> = {}
): RecipientCandidateResponse {
  return {
    memberId: 801,
    actorType: 'MEMBER',
    participantType: 'PARTICIPANT',
    memberType: 'GENERAL',
    typeLabel: '참여자',
    channelType: 'SMS',
    ...overrides,
  }
}

describe('mapSmsRecipientCandidate', () => {
  it('uses recipientName and recipientContact', () => {
    const mapped = mapSmsRecipientCandidate(
      candidate({
        recipientName: '홍길동',
        recipientContact: '010-8000-0001',
        recipientNameMasked: '홍*동',
        recipientContactMasked: '010-****-0001',
      })
    )
    expect(mapped).toMatchObject({
      name: '홍길동',
      phone: '010-8000-0001',
      typeLabel: '참여자',
    })
  })

  it('does not restore plaintext from masked alias fields', () => {
    const mapped = mapSmsRecipientCandidate(
      candidate({
        recipientName: '',
        recipientContact: '',
        recipientNameMasked: '홍길동',
        recipientContactMasked: '010-8000-0001',
      })
    )
    expect(mapped).toMatchObject({
      name: '-',
      phone: '-',
    })
  })
})
