import { describe, expect, it } from 'vitest'
import {
  canCancelParticipantApplicationRejection,
  canRestoreRejectedApplication,
} from '@/features/program/shared/lib/application-available-actions'

describe('canRestoreRejectedApplication', () => {
  it('REJECTED는 availableActions가 없으면 레거시로 반려 취소를 허용한다', () => {
    expect(canRestoreRejectedApplication({ applicationStatus: 'REJECTED' })).toBe(true)
    expect(canCancelParticipantApplicationRejection(undefined)).toBe(true)
  })

  it('REJECTED는 CANCEL_REJECTION이 있을 때만 빈 배열·VIEW만으로는 노출하지 않는다', () => {
    expect(
      canRestoreRejectedApplication({
        applicationStatus: 'REJECTED',
        availableActions: [],
      })
    ).toBe(false)
    expect(canCancelParticipantApplicationRejection(['VIEW'])).toBe(false)
    expect(
      canRestoreRejectedApplication({
        applicationStatus: 'REJECTED',
        availableActions: ['VIEW', 'CANCEL_REJECTION'],
      })
    ).toBe(true)
  })

  it('APPROVAL_CANCELLED는 CANCEL_REJECTION이 명시된 경우에만 복원한다', () => {
    expect(
      canRestoreRejectedApplication({
        applicationStatus: 'APPROVAL_CANCELLED',
      })
    ).toBe(false)
    expect(
      canRestoreRejectedApplication({
        applicationStatus: 'APPROVAL_CANCELLED',
        availableActions: ['VIEW'],
      })
    ).toBe(false)
    expect(
      canRestoreRejectedApplication({
        applicationStatus: 'APPROVAL_CANCELLED',
        availableActions: ['VIEW', 'CANCEL_REJECTION'],
      })
    ).toBe(true)
  })
})
