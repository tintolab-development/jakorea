import { describe, expect, it } from 'vitest'
import { canCancelParticipantApplicationRejection } from '@/features/program/shared/lib/application-available-actions'

describe('canCancelParticipantApplicationRejection', () => {
  it('BE availableActions가 없어도 참여자 신청 반려 취소를 노출한다', () => {
    expect(canCancelParticipantApplicationRejection(undefined)).toBe(true)
    expect(canCancelParticipantApplicationRejection([])).toBe(true)
    expect(canCancelParticipantApplicationRejection(['VIEW'])).toBe(true)
    expect(canCancelParticipantApplicationRejection(['VIEW', 'CANCEL_REJECTION'])).toBe(true)
  })
})
